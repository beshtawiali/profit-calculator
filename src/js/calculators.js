import { formatCurrency, formatPercent, getCurrencySymbol } from './common.js';

document.addEventListener('DOMContentLoaded', () => {
  initProfitMarginCalc();
  initMarkupCalc();
  initSalesTaxCalc();
  initBreakEvenCalc();
  initDiscountCalc();
  initRoiCalc();

  // Re-run current page calculation when currency symbol changes
  window.addEventListener('currencyChange', () => {
    initProfitMarginCalc();
    initMarkupCalc();
    initSalesTaxCalc();
    initBreakEvenCalc();
    initDiscountCalc();
    initRoiCalc();
  });
});

// Helper to parse input values cleanly
function getNum(id, defaultVal = 0) {
  const el = document.getElementById(id);
  if (!el) return defaultVal;
  const val = parseFloat(el.value);
  return isNaN(val) ? defaultVal : val;
}

function setTxt(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/* ==========================================================================
   1. PROFIT MARGIN CALCULATOR
   ========================================================================== */
function initProfitMarginCalc() {
  const costInput = document.getElementById('pm-cost');
  const revInput = document.getElementById('pm-revenue');
  const opexInput = document.getElementById('pm-opex');

  if (!costInput || !revInput) return;

  const calculate = () => {
    const cost = getNum('pm-cost', 0);
    const revenue = getNum('pm-revenue', 0);
    const opex = getNum('pm-opex', 0);

    const grossProfit = revenue - cost;
    const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const markupPct = cost > 0 ? (grossProfit / cost) * 100 : 0;
    const netProfit = grossProfit - opex;
    const netMarginPct = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    setTxt('res-pm-gross-profit', formatCurrency(grossProfit));
    setTxt('res-pm-gross-margin', formatPercent(grossMarginPct));
    setTxt('res-pm-markup', formatPercent(markupPct));
    setTxt('res-pm-net-profit', formatCurrency(netProfit));
    setTxt('res-pm-net-margin', formatPercent(netMarginPct));

    // Update Progress Bar ratio
    const cogsBar = document.getElementById('pm-bar-cogs');
    const profitBar = document.getElementById('pm-bar-profit');
    if (cogsBar && profitBar && revenue > 0) {
      const cogsShare = Math.min(Math.max((cost / revenue) * 100, 0), 100);
      const profitShare = Math.min(Math.max((grossProfit / revenue) * 100, 0), 100);
      cogsBar.style.width = `${cogsShare}%`;
      profitBar.style.width = `${profitShare}%`;
    }
  };

  [costInput, revInput, opexInput].forEach(inp => {
    if (inp) inp.addEventListener('input', calculate);
  });

  // Preset buttons
  const presets = document.querySelectorAll('.pm-preset-btn');
  presets.forEach(btn => {
    btn.addEventListener('click', () => {
      const c = btn.getAttribute('data-cost');
      const r = btn.getAttribute('data-rev');
      if (c && costInput) costInput.value = c;
      if (r && revInput) revInput.value = r;
      calculate();
    });
  });

  calculate();
}

/* ==========================================================================
   2. MARKUP CALCULATOR
   ========================================================================== */
function initMarkupCalc() {
  const costInput = document.getElementById('mk-cost');
  const markupInput = document.getElementById('mk-markup');

  if (!costInput || !markupInput) return;

  const calculate = () => {
    const cost = getNum('mk-cost', 0);
    const markupPct = getNum('mk-markup', 0);

    const profit = cost * (markupPct / 100);
    const sellingPrice = cost + profit;
    const marginPct = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

    setTxt('res-mk-price', formatCurrency(sellingPrice));
    setTxt('res-mk-profit', formatCurrency(profit));
    setTxt('res-mk-margin', formatPercent(marginPct));
    setTxt('res-mk-markup-val', formatPercent(markupPct));

    // Diff tip
    const diffEl = document.getElementById('mk-diff-note');
    if (diffEl) {
      diffEl.textContent = `A ${markupPct.toFixed(1)}% markup on ${formatCurrency(cost)} cost equals a ${marginPct.toFixed(1)}% profit margin.`;
    }
  };

  [costInput, markupInput].forEach(inp => {
    if (inp) inp.addEventListener('input', calculate);
  });

  calculate();
}

/* ==========================================================================
   3. VAT / SALES TAX CALCULATOR
   ========================================================================== */
function initSalesTaxCalc() {
  const amountInput = document.getElementById('st-amount');
  const rateInput = document.getElementById('st-rate');
  const modeSelect = document.getElementById('st-mode');

  if (!amountInput || !rateInput) return;

  const calculate = () => {
    const amount = getNum('st-amount', 0);
    const taxRate = getNum('st-rate', 0);
    const mode = modeSelect ? modeSelect.value : 'add';

    let netPrice = 0;
    let taxAmount = 0;
    let grossPrice = 0;

    if (mode === 'add') {
      // Amount is Net
      netPrice = amount;
      taxAmount = amount * (taxRate / 100);
      grossPrice = netPrice + taxAmount;
    } else {
      // Amount is Gross (extract tax)
      grossPrice = amount;
      netPrice = amount / (1 + taxRate / 100);
      taxAmount = grossPrice - netPrice;
    }

    setTxt('res-st-net', formatCurrency(netPrice));
    setTxt('res-st-tax', formatCurrency(taxAmount));
    setTxt('res-st-gross', formatCurrency(grossPrice));
  };

  [amountInput, rateInput, modeSelect].forEach(inp => {
    if (inp) inp.addEventListener('input', calculate);
    if (inp) inp.addEventListener('change', calculate);
  });

  // Preset rate buttons
  const presets = document.querySelectorAll('.st-preset-btn');
  presets.forEach(btn => {
    btn.addEventListener('click', () => {
      const r = btn.getAttribute('data-rate');
      if (r && rateInput) {
        rateInput.value = r;
        calculate();
      }
    });
  });

  calculate();
}

/* ==========================================================================
   4. BREAK-EVEN CALCULATOR
   ========================================================================== */
function initBreakEvenCalc() {
  const fixedInput = document.getElementById('be-fixed');
  const varInput = document.getElementById('be-variable');
  const priceInput = document.getElementById('be-price');

  if (!fixedInput || !varInput || !priceInput) return;

  const calculate = () => {
    const fixedCosts = getNum('be-fixed', 0);
    const varCostUnit = getNum('be-variable', 0);
    const priceUnit = getNum('be-price', 0);

    const contribMarginUnit = priceUnit - varCostUnit;
    const contribRatio = priceUnit > 0 ? (contribMarginUnit / priceUnit) * 100 : 0;

    let breakEvenUnits = 0;
    let breakEvenRevenue = 0;

    if (contribMarginUnit > 0) {
      breakEvenUnits = fixedCosts / contribMarginUnit;
      breakEvenRevenue = breakEvenUnits * priceUnit;
    }

    setTxt('res-be-units', breakEvenUnits > 0 ? Math.ceil(breakEvenUnits).toLocaleString() + ' units' : 'N/A');
    setTxt('res-be-revenue', formatCurrency(breakEvenRevenue));
    setTxt('res-be-contrib', formatCurrency(contribMarginUnit));
    setTxt('res-be-ratio', formatPercent(contribRatio));

    // Update Break-even visual chart SVG or meters
    updateBreakEvenVisual(fixedCosts, varCostUnit, priceUnit, breakEvenUnits);
  };

  [fixedInput, varInput, priceInput].forEach(inp => {
    if (inp) inp.addEventListener('input', calculate);
  });

  calculate();
}

function updateBreakEvenVisual(fixed, varCost, price, beUnits) {
  const chartEl = document.getElementById('be-chart-container');
  if (!chartEl) return;

  const sym = getCurrencySymbol();
  if (beUnits <= 0 || isNaN(beUnits)) {
    chartEl.innerHTML = `<div class="p-6 text-center text-slate-500 font-medium">Selling price must be higher than variable cost per unit to achieve break-even.</div>`;
    return;
  }

  // Draw simple SVG line chart
  const maxUnits = Math.ceil(beUnits * 2);
  const maxRev = maxUnits * price;

  const svgWidth = 500;
  const svgHeight = 220;
  const padding = 35;

  const getX = (u) => padding + (u / maxUnits) * (svgWidth - 2 * padding);
  const getY = (v) => svgHeight - padding - (v / maxRev) * (svgHeight - 2 * padding);

  // Line Points
  const fixedY = getY(fixed);
  const totalCostStart = getY(fixed);
  const totalCostEnd = getY(fixed + varCost * maxUnits);
  const revenueStart = getY(0);
  const revenueEnd = getY(price * maxUnits);

  const beX = getX(beUnits);
  const beY = getY(beUnits * price);

  chartEl.innerHTML = `
    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="w-full h-auto overflow-visible">
      <!-- Grid lines -->
      <line x1="${padding}" y1="${svgHeight - padding}" x2="${svgWidth - padding}" y2="${svgHeight - padding}" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${svgHeight - padding}" stroke="#cbd5e1" stroke-width="1.5"/>
      
      <!-- Fixed Cost Line -->
      <line x1="${padding}" y1="${fixedY}" x2="${svgWidth - padding}" y2="${fixedY}" stroke="#94a3b8" stroke-dasharray="4" stroke-width="1.5"/>
      
      <!-- Total Cost Line (Fixed + Var) -->
      <line x1="${padding}" y1="${totalCostStart}" x2="${svgWidth - padding}" y2="${totalCostEnd}" stroke="#ef4444" stroke-width="2.5"/>
      
      <!-- Revenue Line -->
      <line x1="${padding}" y1="${revenueStart}" x2="${svgWidth - padding}" y2="${revenueEnd}" stroke="#10b981" stroke-width="2.5"/>

      <!-- Break even point dot -->
      <circle cx="${beX}" cy="${beY}" r="6" fill="#2563eb" stroke="#ffffff" stroke-width="2"/>
      
      <!-- Annotations -->
      <text x="${beX + 10}" y="${beY - 10}" fill="#1e293b" font-size="11" font-weight="bold">Break-Even: ${Math.ceil(beUnits).toLocaleString()} Units</text>
      <text x="${padding + 5}" y="${fixedY - 6}" fill="#64748b" font-size="10">Fixed Costs (${sym}${fixed.toLocaleString()})</text>
      
      <text x="${svgWidth - padding}" y="${svgHeight - padding + 20}" text-anchor="end" fill="#64748b" font-size="10">Units Sold (${maxUnits})</text>
      <text x="${padding}" y="${padding - 10}" fill="#64748b" font-size="10">Revenue / Cost (${sym})</text>
    </svg>
    <div class="flex items-center justify-center space-x-6 mt-3 text-xs font-semibold text-slate-600">
      <div class="flex items-center space-x-1.5"><span class="w-3 h-3 bg-red-500 rounded-full inline-block"></span><span>Total Costs</span></div>
      <div class="flex items-center space-x-1.5"><span class="w-3 h-3 bg-emerald-500 rounded-full inline-block"></span><span>Total Revenue</span></div>
      <div class="flex items-center space-x-1.5"><span class="w-3 h-3 bg-blue-600 rounded-full inline-block"></span><span>Break-Even Point</span></div>
    </div>
  `;
}

/* ==========================================================================
   5. DISCOUNT CALCULATOR
   ========================================================================== */
function initDiscountCalc() {
  const origInput = document.getElementById('dc-orig');
  const disc1Input = document.getElementById('dc-disc1');
  const disc2Input = document.getElementById('dc-disc2');
  const taxInput = document.getElementById('dc-tax');

  if (!origInput || !disc1Input) return;

  const calculate = () => {
    const origPrice = getNum('dc-orig', 0);
    const disc1Pct = getNum('dc-disc1', 0);
    const disc2Pct = getNum('dc-disc2', 0);
    const taxRate = getNum('dc-tax', 0);

    const priceAfterDisc1 = origPrice * (1 - disc1Pct / 100);
    const priceAfterDisc2 = priceAfterDisc1 * (1 - disc2Pct / 100);

    const totalSavings = origPrice - priceAfterDisc2;
    const effectiveDiscPct = origPrice > 0 ? (totalSavings / origPrice) * 100 : 0;

    const taxAmount = priceAfterDisc2 * (taxRate / 100);
    const finalTotal = priceAfterDisc2 + taxAmount;

    setTxt('res-dc-final-price', formatCurrency(finalTotal));
    setTxt('res-dc-savings', formatCurrency(totalSavings));
    setTxt('res-dc-effective-pct', formatPercent(effectiveDiscPct));
    setTxt('res-dc-tax', formatCurrency(taxAmount));
  };

  [origInput, disc1Input, disc2Input, taxInput].forEach(inp => {
    if (inp) inp.addEventListener('input', calculate);
  });

  // Discount presets
  const presets = document.querySelectorAll('.dc-preset-btn');
  presets.forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.getAttribute('data-pct');
      if (p && disc1Input) {
        disc1Input.value = p;
        calculate();
      }
    });
  });

  calculate();
}

/* ==========================================================================
   6. ROI CALCULATOR
   ========================================================================== */
function initRoiCalc() {
  const initialInput = document.getElementById('roi-initial');
  const returnInput = document.getElementById('roi-return');
  const yearsInput = document.getElementById('roi-years');

  if (!initialInput || !returnInput) return;

  const calculate = () => {
    const initial = getNum('roi-initial', 0);
    const finalVal = getNum('roi-return', 0);
    const years = getNum('roi-years', 1);

    const netProfit = finalVal - initial;
    const totalRoiPct = initial > 0 ? (netProfit / initial) * 100 : 0;
    
    let cagrPct = 0;
    if (initial > 0 && finalVal > 0 && years > 0) {
      cagrPct = (Math.pow(finalVal / initial, 1 / years) - 1) * 100;
    }

    const multiple = initial > 0 ? (finalVal / initial) : 0;

    setTxt('res-roi-profit', formatCurrency(netProfit));
    setTxt('res-roi-pct', formatPercent(totalRoiPct));
    setTxt('res-roi-cagr', years > 0 ? formatPercent(cagrPct) : 'N/A');
    setTxt('res-roi-multiple', `${multiple.toFixed(2)}x`);

    // ROI visual tone
    const roiValEl = document.getElementById('res-roi-pct');
    if (roiValEl) {
      if (totalRoiPct > 0) {
        roiValEl.className = 'text-2xl font-bold text-emerald-600';
      } else if (totalRoiPct < 0) {
        roiValEl.className = 'text-2xl font-bold text-red-600';
      } else {
        roiValEl.className = 'text-2xl font-bold text-slate-800';
      }
    }
  };

  [initialInput, returnInput, yearsInput].forEach(inp => {
    if (inp) inp.addEventListener('input', calculate);
  });

  calculate();
}
