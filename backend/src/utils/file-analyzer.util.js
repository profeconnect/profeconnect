const fs = require('fs');
const sizeOf = require('image-size');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function extractFileMetadata(file, isMalwareDetected) {
  let meta = { peso: formatBytes(file.size) };
  
  // Principio de seguridad: No parsear a profundidad archivos infectados
  if (isMalwareDetected) {
    meta.seguridad = "Análisis profundo omitido por presencia de malware.";
    return meta;
  }

  try {
    const mime = file.detectedMime || file.mimetype;
    
    if (mime.startsWith('image/')) {
      const dimensions = sizeOf(file.path);
      meta.resolucion = `${dimensions.width}x${dimensions.height} px`;
      meta.tipo = dimensions.type;
    } 
    else if (mime === 'application/pdf') {
      const dataBuffer = fs.readFileSync(file.path);
      const data = await pdfParse(dataBuffer);
      meta.paginas = data.numpages;
      meta.palabrasAprox = data.text.split(/\s+/).filter(w => w.length > 0).length;
    } 
    else if (mime.includes('wordprocessingml') || mime === 'application/msword') {
      const result = await mammoth.extractRawText({ path: file.path });
      meta.palabrasAprox = result.value.split(/\s+/).filter(w => w.length > 0).length;
    }
    else if (mime.startsWith('text/')) {
      const textContent = fs.readFileSync(file.path, 'utf-8');
      meta.lineas = textContent.split(/\r\n|\r|\n/).length;
      meta.palabrasAprox = textContent.split(/\s+/).filter(w => w.length > 0).length;
      meta.caracteres = textContent.length;
    }
    else if (mime.includes('spreadsheetml') || mime === 'application/vnd.ms-excel') {
      const workbook = xlsx.readFile(file.path);
      meta.hojas = workbook.SheetNames.length;
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      meta.rangoCeldasUso = firstSheet['!ref'] || 'Vacío';
    }
  } catch (e) {
    meta.advertencia = "No se pudo extraer estructura interna.";
  }
  
  return meta;
}

module.exports = { extractFileMetadata };
