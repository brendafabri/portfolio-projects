/******************************************************************************
 * INVOICE CLASSIFIER — Google Apps Script
 * Author: Brenda Fabri · Senior BA & AI Automation Consultant · ATNIA
 * GitHub: github.com/brendafabri
 *
 * Automatically classifies incoming supplier invoices in Gmail using a
 * 5-layer detection engine: subject analysis, multi-signal scoring,
 * XML parsing, bilingual OCR pipeline (ES/CA), and smart fast-path logic.
 *
 * Stack: Google Apps Script · Gmail API · Drive API · DocumentApp · OCR
 * Languages detected: Spanish (ES) + Catalan (CA)
 * Formats supported: PDF · XML · CFDI · UBL · FE
 ******************************************************************************/

/************ CONFIG ************/
const SUPPLIER_LABEL = "FRA PROV";
const GMAIL_SEARCH_BASE = 'in:inbox (filename:pdf OR filename:xml) -label:"FRA PROV"';

const POSITIVE_SUBJECT_HINTS = [ /\bfactura\b/i, /\binvoice\b/i ];

const MAX_THREADS_PER_RUN = 12;
const TIME_BUDGET_MS = 90 * 1000;

const SAVE_TO_DRIVE = false;
const DRIVE_FOLDER_NAME = "Facturas (Proveedores)";

// OCR
const MAX_PDF_BYTES_FOR_OCR = 10 * 1024 * 1024;
const OCR_LANG_PRIMARY = "es";
const OCR_LANG_FALLBACK = "ca";
const MAX_OCR_DOCS_PER_RUN = 20;

const TRUSTED_SUPPLIERS = [];

/************ SIGNAL DICTIONARIES (ES/CAT) ************/
const STRONG_WORDS = [
  "factura","invoice",
  "número de factura","num. factura","nº factura","núm. factura","serie",
  "fecha de emisión","fecha factura","data factura"
];
const TAX_WORDS = [
  "iva","vat","impuesto","impuestos","tax",
  "base imponible","base imposable","quota iva","cuota iva",
  "tipo impositivo","tipus impositiu"
];
const CONTEXT_WORDS = [
  "total factura","total a pagar","subtotal","importe","import",
  "cif","nif","emisor","emissor","proveedor","proveïdor","receptor","client","cliente",
  "forma de pago","forma de pagament"
];

const INVOICE_NO_REGEXPS = [
  /\b(n[ºo]|num(?:ero)?|no\.?|núm\.?)\s*[:\-]?\s*[a-z]?\d{3,}\b/i,
  /\b(fac|fact|inv|invoice|fra|fct)[\s\-_]?\d{2,}\b/i,
  /\b\d{4}[\/\-]\d{1,4}\b/i
];
const AMOUNT_REGEXPS = [
  /(?:€|\$)?\s*\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})\b/,
  /\b\d+(?:[.,]\d{2})\s*(?:eur|€)\b/i
];

/************ NEGATIVE PATTERNS ************/
const NEGATIVE_SUBJECT_PATTERNS = [
  /factura(s)?\s+cliente(s)?/i, /\bfacturación\s+clientes?\b/i,
  /\bfactura(s)?\s+de\s+clientes?\b/i, /\bfc[-_ ]?\d{1,}\b/i
];
const NEGATIVE_TEXT_PATTERNS = [
  /factura(s)?\s+cliente(s)?/i, /\bfacturación\s+clientes?\b/i,
  /\bfactura(s)?\s+de\s+clientes?\b/i
];

const NON_INVOICE_SUBJECT_PATTERNS = [
  /\brecibo\b/i, /\breceipt\b/i, /\bticket\b/i, /\bproforma\b/i,
  /\bpresupuesto\b/i, /\bcotizaci[oó]n\b/i, /\bpropuesta\b/i,
  /\balbar[aá]n\b/i, /\bremito\b/i, /\bnota\s+de\s+cr[eé]dito\b/i,
  /\bcontrato\b/i, /\bacuerdo\b/i, /\banexo\b/i, /\bdocumento\b/i
];
const NON_INVOICE_FILENAME_PATTERNS = [
  /recibo/i, /receipt/i, /ticket/i, /proforma/i,
  /presupuesto/i, /albar/i, /remito/i, /nota[-_\s]?credito/i,
  /contrato/i, /acuerdo/i, /anexo/i
];
const NON_INVOICE_TEXT_PATTERNS = [
  /recibo/i, /receipt/i, /ticket/i, /proforma/i,
  /presupuesto/i, /albar[aá]n/i, /remito/i,
  /nota\s+de\s+cr[eé]dito/i, /\bcontrato\b/i, /\bacuerdo\b/i
];

const XML_MARKERS = [
  "cfdi:comprobante","<invoice","<factura","<fe:factura",
  "comprobantede","<cac:invoice","<ubl:invoice"
];

/************ STATE ************/
const DEBUG_MODE = false;
let __LABEL_CACHE = null;
let __OCR_COUNT = 0;

/************ ENTRY POINTS ************/

/** Main trigger — runs every 15 minutes */
function processSupplierInvoices() {
  runEngine(buildQueryWithAfter(), MAX_THREADS_PER_RUN, TIME_BUDGET_MS);
}

/** One-time backlog processing */
function processBacklogOnce() {
  runEngine(GMAIL_SEARCH_BASE, 30, 4 * 60 * 1000);
}

/** Install the 15-minute recurring trigger */
function installEvery15MinutesTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction && t.getHandlerFunction() === "processSupplierInvoices") {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger("processSupplierInvoices").timeBased().everyMinutes(15).create();
}

/************ ENGINE ************/
function runEngine(query, pageSize, timeBudgetMs) {
  const start = Date.now();
  const qflag = PropertiesService.getScriptProperties().getProperty("GMAIL_QUOTA_HIT");
  if (qflag === "1") { console.log("Quota Gmail agotada hoy."); return; }
  __OCR_COUNT = 0;

  let threads = [];
  try {
    threads = GmailApp.search(query, 0, pageSize);
  } catch (e) {
    if (String(e).includes("Service invoked too many times")) {
      PropertiesService.getScriptProperties().setProperty("GMAIL_QUOTA_HIT", "1");
      return;
    }
    throw e;
  }

  if (!threads.length) { bumpLastRun(); return; }

  const supplierLabel = getOrCreateLabelSafe(SUPPLIER_LABEL);
  for (const thread of threads) {
    if (Date.now() - start > timeBudgetMs) break;
    handleThread(thread, supplierLabel);
    Utilities.sleep(50);
  }
  bumpLastRun();
}

/************ CORE CLASSIFIER ************/
function handleThread(thread, supplierLabel) {
  const reasons = [];
  const subj0 = thread.getFirstMessageSubject() || "(sin asunto)";

  let anyPositiveSubject = false;
  let blockAsClient = false;
  let nonInvoiceHit = false;
  let allAttachments = [];
  let hasPdf = false, hasXml = false;

  const messages = thread.getMessages();
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const subj = msg.getSubject() || "";
    const body = (msg.getPlainBody && msg.getPlainBody())
      ? msg.getPlainBody().slice(0, 6000) : "";

    if (!anyPositiveSubject && matchesAnyPattern(subj, POSITIVE_SUBJECT_HINTS)) {
      anyPositiveSubject = true;
    }

    if (matchesAnyPattern(subj, NEGATIVE_SUBJECT_PATTERNS) ||
        matchesAnyPattern(body, NEGATIVE_TEXT_PATTERNS)) {
      blockAsClient = true;
      reasons.push("bloqueo: factura cliente en asunto/cuerpo");
      break;
    }

    if (matchesAnyPattern(subj, NON_INVOICE_SUBJECT_PATTERNS)) {
      nonInvoiceHit = true;
      reasons.push("NO-factura en asunto");
    }

    const atts = msg.getAttachments({ includeInlineImages: false }) || [];
    for (const a of atts) {
      const name = a.getName() || "";
      const ct = (a.getContentType && a.getContentType()) || "";
      const ext = (name.split(".").pop() || "").toLowerCase();

      if (matchesAnyPattern(name, NON_INVOICE_FILENAME_PATTERNS)) {
        nonInvoiceHit = true;
        reasons.push("NO-factura por filename: " + name);
      }

      const isPdf = isPdfLoose(a, name, ct, ext);
      const isXml = ext === "xml";
      if (!isPdf && !isXml) continue;

      if (isPdf) hasPdf = true;
      if (isXml) hasXml = true;
      allAttachments.push({ blob: a, name, ext: isPdf ? "pdf" : "xml", msg, ct });
    }
  }

  if (!hasPdf && !hasXml) { logDecision(subj0, "NO TAG: sin PDF/XML", reasons); return; }
  if (blockAsClient)       { logDecision(subj0, "NO TAG: cliente", reasons); return; }
  if (nonInvoiceHit)       { logDecision(subj0, "NO TAG: NO-factura", reasons); return; }

  // FAST-PATH: subject confirms "factura" + has PDF
  if (anyPositiveSubject && hasPdf) {
    return tagOrSim(thread, supplierLabel, subj0, "FAST: subject 'factura' + PDF");
  }

  // LAYER 1 — XML scoring
  for (const att of allAttachments) {
    if (att.ext !== "xml") continue;
    let xml = "";
    try { xml = att.blob.getDataAsString(); } catch (e) {}
    if (!xml) { reasons.push("xml vacío"); continue; }

    if (matchesAnyPattern(xml, NON_INVOICE_TEXT_PATTERNS)) { reasons.push("xml NO-factura"); continue; }
    if (matchesAnyPattern(xml, NEGATIVE_TEXT_PATTERNS))    { reasons.push("xml cliente");   continue; }

    const score = scoreInvoiceSignals(xml);
    if (looksLikeInvoiceXML(xml) && score >= 2) {
      return tagOrSim(thread, supplierLabel, subj0, `OK XML score=${score}`);
    }
    reasons.push("xml score=" + score);
  }

  // LAYER 2 — PDF OCR with bilingual fallback (ES → CA)
  let pdfChecked = 0;
  for (const att of allAttachments) {
    if (att.ext !== "pdf") continue;
    if (pdfChecked >= 2) { reasons.push("OCR: límite 2 PDFs por hilo"); break; }
    if (__OCR_COUNT >= MAX_OCR_DOCS_PER_RUN) { reasons.push("OCR: tope global alcanzado"); break; }
    pdfChecked++; __OCR_COUNT++;

    let approx = 0;
    try { approx = (att.blob.getBytes() || []).length; } catch(e) {}
    if (approx && approx > MAX_PDF_BYTES_FOR_OCR) {
      reasons.push(`PDF grande (${Math.round(approx/1024/1024)}MB)`);
      continue;
    }

    let text = "";
    try { text = ocrPdfToText(att.blob, OCR_LANG_PRIMARY); }
    catch (e) { reasons.push("OCR error ES: " + e); }

    let score = text ? scoreInvoiceSignals(text) : 0;

    // Fallback to Catalan if score insufficient
    if (text && score < 2) {
      let textCa = "";
      try { textCa = ocrPdfToText(att.blob, OCR_LANG_FALLBACK); } catch(e) {}
      if (textCa) {
        const sc2 = scoreInvoiceSignals(textCa);
        if (sc2 > score) {
          text = textCa;
          score = sc2;
          reasons.push(`fallback CA mejoró score a ${score}`);
        }
      }
    }

    if (!text) { reasons.push("OCR vacío"); continue; }
    if (matchesAnyPattern(text, NON_INVOICE_TEXT_PATTERNS)) { reasons.push("OCR NO-factura"); continue; }
    if (matchesAnyPattern(text, NEGATIVE_TEXT_PATTERNS))    { reasons.push("OCR cliente");   continue; }

    reasons.push(`OCR len=${text.length}, score=${score}`);
    if (score >= 2) return tagOrSim(thread, supplierLabel, subj0, `OK PDF score=${score}`);
  }

  logDecision(subj0, "NO TAG: sin evidencia suficiente", reasons);
}

/************ SCORING ************/
function scoreInvoiceSignals(t) {
  const s1 = containsAny(t, STRONG_WORDS);
  const s2 = matchesAnyRegex(t, AMOUNT_REGEXPS);
  const s3 = matchesAnyRegex(t, INVOICE_NO_REGEXPS);
  const s4 = containsAny(t, TAX_WORDS);
  const s5 = containsAny(t, CONTEXT_WORDS);
  return [s1, s2, s3, s4, s5].filter(Boolean).length;
}

/************ ACTIONS ************/
function tagOrSim(thread, label, subj, note) {
  if (DEBUG_MODE) { console.log(`[DEBUG][TAG-SIM] ${subj} → ${note}`); return; }
  thread.addLabel(label);
  thread.moveToArchive();
  console.log(`[TAG] ${subj} → ${note}`);
}

function logDecision(subj, status, reasons) {
  const mode = DEBUG_MODE ? "DEBUG" : "RUN";
  console.log(`[${mode}] ${status} — ${subj}`);
  reasons.forEach(r => console.log("   · " + r));
}

/************ STATE MANAGEMENT ************/
function buildQueryWithAfter() {
  const props = PropertiesService.getScriptProperties();
  const last = Number(props.getProperty("LAST_RUN_MS") || 0);
  const fromMs = Math.max(0, last - 5 * 60 * 1000);
  const afterSec = Math.floor(fromMs / 1000);
  const afterPart = last ? ` after:${afterSec}` : "";
  return GMAIL_SEARCH_BASE + afterPart;
}

function bumpLastRun() {
  PropertiesService.getScriptProperties().setProperty("LAST_RUN_MS", String(Date.now()));
}

function getOrCreateLabelSafe(name) {
  if (__LABEL_CACHE) return __LABEL_CACHE;
  try {
    __LABEL_CACHE = GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
    return __LABEL_CACHE;
  } catch (e) {
    const msg = String(e && e.message || e);
    if (msg.includes("Service invoked too many times")) {
      PropertiesService.getScriptProperties().setProperty("GMAIL_QUOTA_HIT", "1");
      throw e;
    }
    throw e;
  }
}

/************ HELPERS ************/
function matchesAnyPattern(str, patterns) {
  if (!str) return false;
  return patterns.some(re => re.test(str));
}
function containsAny(text, words) {
  const t = (text || "").toLowerCase();
  return (words || []).some(w => t.includes(w.toLowerCase()));
}
function matchesAnyRegex(text, regexps) {
  return (regexps || []).some(rx => rx.test(text || ""));
}
function looksLikeInvoiceXML(xmlText) {
  const lower = (xmlText || "").toLowerCase();
  return XML_MARKERS.some(m => lower.includes(m));
}
function isPdfLoose(blob, name, contentType, ext) {
  const ct = (contentType || "").toLowerCase();
  if (ext === "pdf" || ct.includes("pdf")) return true;
  try {
    const b = blob.getBytes();
    if (b && b.length >= 5 &&
        b[0]===0x25 && b[1]===0x50 && b[2]===0x44 && b[3]===0x46 && b[4]===0x2D) return true;
  } catch(e) {}
  return /\.pdf$/i.test(name);
}

/************ OCR ************/
function ocrPdfToText(attBlob, lang) {
  const ct0 = (attBlob.getContentType && attBlob.getContentType()) || "";
  let blob = attBlob;
  if (ct0.toLowerCase() !== "application/pdf") {
    blob = attBlob.copyBlob().setContentType("application/pdf");
  }
  const resource = { title: "ocr_tmp_" + new Date().toISOString() };
  let created;
  try {
    created = Drive.Files.insert(resource, blob, { convert: true, ocr: true, ocrLanguage: lang || "es" });
  } catch(e) {
    created = Drive.Files.insert(resource, blob, { ocr: true, ocrLanguage: lang || "es" });
  }
  const doc = DocumentApp.openById(created.id);
  const text = doc.getBody().getText();
  try { Drive.Files.trash(created.id); } catch(e) {}
  return text || "";
}
