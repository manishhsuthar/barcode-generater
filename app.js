/**
 * PrintoGraph Barcode & Label Studio - Application Logic
 */

// Global State
const state = {
  products: [],
  layout: {
    paperSize: 'A4',
    cols: 3,
    rows: 8,
    marginTop: 8, // mm
    marginLeft: 8, // mm
    gapX: 2.5, // mm
    gapY: 2.5, // mm
    showBorder: true,
    showTitle: true,
    showPrice: true,
    showCodeText: true,
    currencySymbol: 'Rs.',
    barcodeType: 'CODE128',
    barcodeHeight: 35, // px equivalent scale
    companyHeader: ''
  },
  currentPage: 1,
  startSequence: 890100000001
};

// Initial Sample Product Catalog (derived from project sample data)
const SAMPLE_PRODUCTS = [
  { id: '1', name: 'Ball Pen Blue', price: 30.00, qty: 12, barcode: '8901000000019' },
  { id: '2', name: 'Gel Pen Black', price: 35.00, qty: 10, barcode: '8901000000026' },
  { id: '3', name: 'Pencil 3HB Pack', price: 50.00, qty: 8, barcode: '8901000000033' },
  { id: '4', name: 'Eraser Soft Grip', price: 20.00, qty: 15, barcode: '8901000000040' },
  { id: '5', name: 'Sharpener Heavy Duty', price: 45.00, qty: 6, barcode: '8901000000057' },
  { id: '6', name: 'Notebook A5 Ruled', price: 120.00, qty: 5, barcode: '8901000000064' },
  { id: '7', name: 'Marker Permanent Black', price: 60.00, qty: 8, barcode: '8901000000071' },
  { id: '8', name: 'Highlighter Neon Yellow', price: 55.00, qty: 10, barcode: '8901000000088' }
];

// Initialize application on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initEventListeners();
  loadSampleData();
  renderSingleBarcodeQuick();
});

/* ==========================================================================
   EAN-13 Check Digit Calculation Logic (Parity with Python script)
   ========================================================================== */
function calculateEan13CheckDigit(number12) {
  const str = String(number12).padStart(12, '0');
  let oddSum = 0;
  let evenSum = 0;

  for (let i = 0; i < 12; i++) {
    const digit = parseInt(str[i], 10);
    if (i % 2 === 0) {
      oddSum += digit;
    } else {
      evenSum += digit;
    }
  }

  const total = oddSum + (evenSum * 3);
  return (10 - (total % 10)) % 10;
}

function generateEan13Barcode(base12) {
  const check = calculateEan13CheckDigit(base12);
  return `${base12}${check}`;
}

/* ==========================================================================
   Navigation & Tab Controls
   ========================================================================== */
function initNavigation() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const sections = document.querySelectorAll('.view-section');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.dataset.target;

      tabBtns.forEach(b => b.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(targetView).classList.add('active');

      if (targetView === 'previewView') {
        renderLabelSheetPreview();
      }
    });
  });
}

/* ==========================================================================
   Event Listeners
   ========================================================================== */
function initEventListeners() {
  // Add single product form
  const addForm = document.getElementById('addProductForm');
  if (addForm) {
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('inputName').value.trim();
      const price = parseFloat(document.getElementById('inputPrice').value) || 0;
      const qty = parseInt(document.getElementById('inputQty').value, 10) || 1;
      let barcode = document.getElementById('inputBarcode').value.trim();

      if (!barcode) {
        barcode = generateEan13Barcode(state.startSequence++);
      }

      state.products.push({
        id: Date.now().toString(),
        name,
        price,
        qty,
        barcode
      });

      addForm.reset();
      updateProductsTable();
      showToast('Product added successfully!');
    });
  }

  // File Upload / Excel Parser
  const fileInput = document.getElementById('fileInput');
  const dropzone = document.getElementById('dropzone');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        handleFileUpload(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length) {
        handleFileUpload(e.target.files[0]);
      }
    });
  }

  // Auto-Generate Barcodes Button
  const btnAutoBarcodes = document.getElementById('btnAutoBarcodes');
  if (btnAutoBarcodes) {
    btnAutoBarcodes.addEventListener('click', () => {
      let count = 0;
      state.products.forEach(p => {
        if (!p.barcode || p.barcode.trim() === '') {
          p.barcode = generateEan13Barcode(state.startSequence++);
          count++;
        }
      });
      updateProductsTable();
      showToast(`Generated ${count} EAN-13 barcodes!`);
    });
  }

  // Load Sample Data Button
  const btnLoadSample = document.getElementById('btnLoadSample');
  if (btnLoadSample) {
    btnLoadSample.addEventListener('click', () => loadSampleData());
  }

  // Clear All Button
  const btnClearAll = document.getElementById('btnClearAll');
  if (btnClearAll) {
    btnClearAll.addEventListener('click', () => {
      if (confirm('Clear all products from table?')) {
        state.products = [];
        updateProductsTable();
        showToast('Table cleared.');
      }
    });
  }

  // Export Excel Button
  const btnExportExcel = document.getElementById('btnExportExcel');
  if (btnExportExcel) {
    btnExportExcel.addEventListener('click', () => exportToExcel());
  }

  // Layout Designer Controls
  const presetSelect = document.getElementById('presetSelect');
  if (presetSelect) {
    presetSelect.addEventListener('change', (e) => {
      applyLayoutPreset(e.target.value);
      renderLabelSheetPreview();
    });
  }

  const layoutInputs = ['colsInput', 'rowsInput', 'marginTopInput', 'marginLeftInput', 'gapXInput', 'gapYInput', 'currencyInput', 'companyHeaderInput'];
  layoutInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        updateLayoutFromForm();
        renderLabelSheetPreview();
      });
    }
  });

  const switches = ['switchBorder', 'switchTitle', 'switchPrice', 'switchCodeText'];
  switches.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => {
        updateLayoutFromForm();
        renderLabelSheetPreview();
      });
    }
  });

  // Single Quick Barcode Form
  const quickInput = document.getElementById('quickBarcodeText');
  const quickType = document.getElementById('quickBarcodeType');
  if (quickInput && quickType) {
    quickInput.addEventListener('input', renderSingleBarcodeQuick);
    quickType.addEventListener('change', renderSingleBarcodeQuick);
  }

  // Print Buttons
  document.querySelectorAll('.btn-print').forEach(btn => {
    btn.addEventListener('click', () => {
      window.print();
    });
  });
}

/* ==========================================================================
   Spreadsheet / Excel Import Logic (SheetJS)
   ========================================================================== */
function handleFileUpload(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);

      if (!json.length) {
        alert('Uploaded spreadsheet appears to be empty.');
        return;
      }

      // Map columns (case-insensitive fuzzy match)
      const sampleRow = json[0];
      const keys = Object.keys(sampleRow);

      const findKey = (candidates) => {
        return keys.find(k => candidates.some(c => k.toLowerCase().trim() === c.toLowerCase().trim()));
      };

      const nameKey = findKey(['name', 'product name', 'product', 'title']) || keys[0];
      const priceKey = findKey(['price', 'sales price', 'sale price', 'rate']);
      const qtyKey = findKey(['quantity', 'qty', 'stock', 'on hand', 'qty_available']);
      const barcodeKey = findKey(['barcode', 'barcode number', 'code', 'ean', 'upc']);

      const imported = json.map((row, idx) => {
        let barcodeVal = barcodeKey ? String(row[barcodeKey] || '').trim() : '';
        if (!barcodeVal) {
          barcodeVal = generateEan13Barcode(state.startSequence++);
        }
        return {
          id: Date.now() + '_' + idx,
          name: row[nameKey] ? String(row[nameKey]).trim() : `Item #${idx + 1}`,
          price: priceKey ? (parseFloat(row[priceKey]) || 0) : 0,
          qty: qtyKey ? (parseInt(row[qtyKey], 10) || 1) : 1,
          barcode: barcodeVal
        };
      });

      state.products = imported;
      updateProductsTable();
      showToast(`Successfully imported ${imported.length} products!`);
    } catch (err) {
      console.error(err);
      alert('Error parsing Excel/CSV file. Please check file format.');
    }
  };
  reader.readAsArrayBuffer(file);
}

/* ==========================================================================
   Table & UI Rendering
   ========================================================================== */
function loadSampleData() {
  state.products = [...SAMPLE_PRODUCTS];
  updateProductsTable();
}

function updateProductsTable() {
  const tbody = document.getElementById('productsTableBody');
  const totalCountEl = document.getElementById('statTotalProducts');
  const totalLabelsEl = document.getElementById('statTotalLabels');

  if (!tbody) return;

  tbody.innerHTML = '';

  let totalLabels = 0;

  state.products.forEach((prod, index) => {
    totalLabels += (prod.qty > 0 ? prod.qty : 0);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>
        <input type="text" class="table-input" value="${escapeHtml(prod.name)}" 
               onchange="updateProductField('${prod.id}', 'name', this.value)">
      </td>
      <td>
        <input type="number" class="table-input" value="${prod.price}" step="0.01" 
               onchange="updateProductField('${prod.id}', 'price', parseFloat(this.value)||0)">
      </td>
      <td>
        <input type="number" class="table-input" value="${prod.qty}" min="0" 
               onchange="updateProductField('${prod.id}', 'qty', parseInt(this.value, 10)||0)">
      </td>
      <td>
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <input type="text" class="table-input" style="font-family:var(--font-mono);" 
                 value="${escapeHtml(prod.barcode)}" 
                 onchange="updateProductField('${prod.id}', 'barcode', this.value)">
          <button class="btn btn-outline btn-sm" title="Generate EAN-13" onclick="assignEan13('${prod.id}')">
            🪄
          </button>
        </div>
      </td>
      <td style="text-align:center;">
        <button class="btn btn-danger btn-sm" onclick="removeProduct('${prod.id}')">✕</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (totalCountEl) totalCountEl.textContent = state.products.length;
  if (totalLabelsEl) totalLabelsEl.textContent = totalLabels;
}

function updateProductField(id, field, val) {
  const prod = state.products.find(p => p.id === id);
  if (prod) {
    prod[field] = val;
    updateProductsTable();
  }
}

function assignEan13(id) {
  const prod = state.products.find(p => p.id === id);
  if (prod) {
    prod.barcode = generateEan13Barcode(state.startSequence++);
    updateProductsTable();
    showToast('EAN-13 Barcode Assigned!');
  }
}

function removeProduct(id) {
  state.products = state.products.filter(p => p.id !== id);
  updateProductsTable();
}

/* ==========================================================================
   Export Spreadsheet with Barcodes
   ========================================================================== */
function exportToExcel() {
  if (!state.products.length) {
    alert('No products to export.');
    return;
  }

  const exportData = state.products.map(p => ({
    'Name': p.name,
    'Sales Price': p.price,
    'Quantity': p.qty,
    'Barcode': p.barcode
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

  XLSX.writeFile(workbook, 'products_with_barcodes.xlsx');
  showToast('Excel downloaded: products_with_barcodes.xlsx');
}

/* ==========================================================================
   Layout Preset System
   ========================================================================== */
function applyLayoutPreset(presetKey) {
  switch (presetKey) {
    case 'a4_3x8':
      state.layout.cols = 3;
      state.layout.rows = 8;
      state.layout.marginTop = 8;
      state.layout.marginLeft = 8;
      state.layout.gapX = 2.5;
      state.layout.gapY = 2.5;
      break;
    case 'a4_2x7':
      state.layout.cols = 2;
      state.layout.rows = 7;
      state.layout.marginTop = 10;
      state.layout.marginLeft = 10;
      state.layout.gapX = 4;
      state.layout.gapY = 4;
      break;
    case 'a4_4x10':
      state.layout.cols = 4;
      state.layout.rows = 10;
      state.layout.marginTop = 5;
      state.layout.marginLeft = 5;
      state.layout.gapX = 2;
      state.layout.gapY = 2;
      break;
    case 'thermal_50x25':
      state.layout.cols = 1;
      state.layout.rows = 1;
      state.layout.marginTop = 2;
      state.layout.marginLeft = 2;
      state.layout.gapX = 0;
      state.layout.gapY = 0;
      break;
  }
  syncFormFromLayout();
}

function syncFormFromLayout() {
  document.getElementById('colsInput').value = state.layout.cols;
  document.getElementById('rowsInput').value = state.layout.rows;
  document.getElementById('marginTopInput').value = state.layout.marginTop;
  document.getElementById('marginLeftInput').value = state.layout.marginLeft;
  document.getElementById('gapXInput').value = state.layout.gapX;
  document.getElementById('gapYInput').value = state.layout.gapY;
  document.getElementById('currencyInput').value = state.layout.currencySymbol;
  document.getElementById('companyHeaderInput').value = state.layout.companyHeader;
}

function updateLayoutFromForm() {
  state.layout.cols = parseInt(document.getElementById('colsInput').value, 10) || 3;
  state.layout.rows = parseInt(document.getElementById('rowsInput').value, 10) || 8;
  state.layout.marginTop = parseFloat(document.getElementById('marginTopInput').value) || 8;
  state.layout.marginLeft = parseFloat(document.getElementById('marginLeftInput').value) || 8;
  state.layout.gapX = parseFloat(document.getElementById('gapXInput').value) || 2.5;
  state.layout.gapY = parseFloat(document.getElementById('gapYInput').value) || 2.5;
  state.layout.currencySymbol = document.getElementById('currencyInput').value;
  state.layout.companyHeader = document.getElementById('companyHeaderInput').value;

  state.layout.showBorder = document.getElementById('switchBorder').checked;
  state.layout.showTitle = document.getElementById('switchTitle').checked;
  state.layout.showPrice = document.getElementById('switchPrice').checked;
  state.layout.showCodeText = document.getElementById('switchCodeText').checked;
}

/* ==========================================================================
   Printable Label Sheet Renderer (A4 Live Grid Engine)
   ========================================================================== */
function renderLabelSheetPreview() {
  const container = document.getElementById('sheetWrapper');
  if (!container) return;

  container.innerHTML = '';

  // Expand products by quantity
  const queue = [];
  state.products.forEach(p => {
    for (let i = 0; i < p.qty; i++) {
      queue.push(p);
    }
  });

  if (queue.length === 0) {
    container.innerHTML = `
      <div style="color:var(--text-secondary); text-align:center; padding:3rem;">
        <h3>No labels to display</h3>
        <p>Add products or increase stock quantity to generate printable labels.</p>
      </div>`;
    return;
  }

  const labelsPerPage = state.layout.cols * state.layout.rows;
  const totalPages = Math.ceil(queue.length / labelsPerPage);

  document.getElementById('pageInfo').textContent = `Total Labels: ${queue.length} (${totalPages} Page${totalPages > 1 ? 's' : ''})`;

  for (let p = 0; p < totalPages; p++) {
    const pageDiv = document.createElement('div');
    pageDiv.className = 'sheet-page';
    pageDiv.style.gridTemplateColumns = `repeat(${state.layout.cols}, 1fr)`;
    pageDiv.style.gridTemplateRows = `repeat(${state.layout.rows}, 1fr)`;
    pageDiv.style.padding = `${state.layout.marginTop}mm ${state.layout.marginLeft}mm`;
    pageDiv.style.gap = `${state.layout.gapY}mm ${state.layout.gapX}mm`;

    const pageLabels = queue.slice(p * labelsPerPage, (p + 1) * labelsPerPage);

    pageLabels.forEach((item, idx) => {
      const cell = document.createElement('div');
      cell.className = `label-cell ${state.layout.showBorder ? '' : 'no-border'}`;

      let companyHtml = state.layout.companyHeader ? `<div style="font-size:6pt; font-weight:bold; text-transform:uppercase; color:#64748b; margin-bottom:1mm;">${escapeHtml(state.layout.companyHeader)}</div>` : '';
      let titleHtml = state.layout.showTitle ? `<div class="label-title">${escapeHtml(item.name)}</div>` : '';
      let priceHtml = state.layout.showPrice ? `<div class="label-price">${state.layout.currencySymbol} ${parseFloat(item.price).toFixed(2)}</div>` : '';
      let codeHtml = state.layout.showCodeText ? `<div class="label-code">${item.barcode}</div>` : '';

      const svgId = `bc_${p}_${idx}_${Date.now()}`;

      cell.innerHTML = `
        ${companyHtml}
        ${titleHtml}
        <div class="label-barcode">
          <svg id="${svgId}"></svg>
        </div>
        <div class="label-footer">
          ${codeHtml}
          ${priceHtml}
        </div>
      `;

      pageDiv.appendChild(cell);

      // Render Barcode via JsBarcode on next event loop tick
      setTimeout(() => {
        try {
          JsBarcode(`#${svgId}`, item.barcode, {
            format: isNumeric(item.barcode) && item.barcode.length === 13 ? 'EAN13' : 'CODE128',
            width: 1.4,
            height: 38,
            displayValue: false,
            margin: 0
          });
        } catch (e) {
          // Fallback to Code128 if EAN13 check fails validation
          try {
            JsBarcode(`#${svgId}`, item.barcode, {
              format: 'CODE128',
              width: 1.2,
              height: 35,
              displayValue: false,
              margin: 0
            });
          } catch (err) {
            console.error('Barcode render error:', err);
          }
        }
      }, 0);
    });

    container.appendChild(pageDiv);
  }
}

/* ==========================================================================
   Quick Single Barcode Generator Tool
   ========================================================================== */
function renderSingleBarcodeQuick() {
  const textInput = document.getElementById('quickBarcodeText');
  const typeSelect = document.getElementById('quickBarcodeType');
  const svg = document.getElementById('quickBarcodeSvg');

  if (!textInput || !svg) return;

  let text = textInput.value.trim() || '8901000000019';
  let format = typeSelect.value || 'CODE128';

  try {
    JsBarcode(svg, text, {
      format: format,
      width: 2,
      height: 70,
      displayValue: true,
      fontSize: 14,
      margin: 10
    });
  } catch (err) {
    // If user selected EAN13 but typed custom string, attempt auto EAN-13 calculation
    if (format === 'EAN13' && text.length === 12 && isNumeric(text)) {
      text = generateEan13Barcode(text);
      textInput.value = text;
      JsBarcode(svg, text, { format: 'EAN13', width: 2, height: 70, displayValue: true });
    }
  }
}

/* Download Quick Barcode SVG */
function downloadQuickSvg() {
  const svg = document.getElementById('quickBarcodeSvg');
  if (!svg) return;

  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(svg);
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `barcode_${Date.now()}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* ==========================================================================
   Helper Utilities
   ========================================================================== */
function isNumeric(str) {
  return /^\d+$/.test(str);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.backgroundColor = '#10b981';
  toast.style.color = '#ffffff';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '8px';
  toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
  toast.style.fontWeight = '600';
  toast.style.zIndex = '9999';
  toast.style.animation = 'fadeIn 0.3s ease';
  toast.textContent = message;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2500);
}
