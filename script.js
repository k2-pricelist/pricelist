// --- AUTHORIZATION CREDENTIALS CONFIGURATION ---
const correctUsername = "admin";       
const correctPassword = "K2PL@7890";  

// ⚠️ PASTE YOUR LIVE GOOGLE SHEETS DEPLOYMENT EXEC URL HERE:
const apiURL = "https://script.google.com/macros/s/AKfycbx1IYRxN2dVSlW1PFuUiE5O94DDAnXxCan5yHsnd_nrJ9ZuHgmiDc9gEDCJqlT7Yxa4/exec";

// DOM Elements Lifecycle Bindings
const loginOverlay = document.getElementById("loginOverlay");
const loginError = document.getElementById("loginError");
const appContainer = document.getElementById("appContainer");
const loader = document.getElementById("loader");
const progressText = document.getElementById("progressText");
const dataContainer = document.getElementById("data");

// Page initialization lifecycle check
document.addEventListener("DOMContentLoaded", () => {
  if (sessionStorage.getItem("isLoggedIn") === "true") {
    // Already authenticated in this session, skip form
    loginOverlay.style.display = "none";
    startDataLoaderEngine();
  }
});

// Form processing router
function handleLogin(event) {
  event.preventDefault();
  const userField = document.getElementById("username").value.trim();
  const passField = document.getElementById("password").value.trim();

  if (userField === correctUsername && passField === correctPassword) {
    loginError.style.display = "none"; // Fixed style typo here
    loginOverlay.style.display = "none";
    sessionStorage.setItem("isLoggedIn", "true");
    startDataLoaderEngine();
  } else {
    loginError.style.display = "block";
    document.getElementById("password").value = ""; // clear password field on error
  }
}

// Data parser pipeline orchestration
function startDataLoaderEngine() {
  loader.style.display = "flex";
  appContainer.style.display = "block";

  let progress = 0;
  const timer = setInterval(() => {
    if (progress < 90) {
      progress += 2;
      progressText.textContent = progress + "%";
    }
  }, 100);

  fetch(apiURL)
    .then(res => res.json())
    .then(rows => {
      clearInterval(timer);
      progressText.textContent = "100%";

      if (rows.length === 0) {
        loader.style.display = "none";
        dataContainer.innerHTML = "<h2>No matching visible data records found in the spreadsheet view.</h2>";
        return;
      }

      const getSpreadsheetValue = (row, possibleKeys) => {
        for (let key of possibleKeys) {
          if (row[key] !== undefined && row[key] !== null) return row[key];
        }
        const cleanKeys = possibleKeys.map(k => k.toLowerCase().replace(/[\s_]+/g, ''));
        for (let rowKey in row) {
          const cleanRowKey = rowKey.toLowerCase().replace(/[\s_]+/g, '');
          if (cleanKeys.includes(cleanRowKey)) return row[rowKey];
        }
        return "";
      };

      const initialRow = rows[0];
      document.getElementById("priceListName").textContent = getSpreadsheetValue(initialRow, ["Pricelist Name", "pricelist_name"]) || "PRICE LIST MASTER";
      document.getElementById("wefDate").textContent = initialRow["W.E.F."] ? `W.E.F. ${initialRow["W.E.F."]}` : "";
      
      const changeDateNode = document.getElementById("changeDate");
      const priceChangeVal = getSpreadsheetValue(initialRow, ["Price Change date & month & year", "price_change_date"]);
      if (priceChangeVal) {
        changeDateNode.textContent = `Last Changed: ${priceChangeVal}`;
      } else {
        changeDateNode.style.display = "none";
      }

      if (initialRow["k2_logo"]) {
        document.getElementById("logoLeftContainer").innerHTML = `
          <img src="${initialRow["k2_logo"]}" alt="K2 Logo" class="logo-img">
        `;
      }
      if (initialRow["konkem_logo"]) {
        document.getElementById("logoRightContainer").innerHTML = `
          <img src="${initialRow["konkem_logo"]}" alt="Konkem Logo" class="logo-img">
        `;
      }

      document.getElementById("docVersion").textContent = initialRow["Versions"] || "";

      // Build Matrix Layout
      const productTree = {};
      rows.forEach(row => {
        
        // 🛑 VISIBILITY FILTER CHECK
        const isVisible = row["Visible"] !== undefined ? row["Visible"] : row["visible"];
        if (isVisible && String(isVisible).trim().toLowerCase() === "no") {
          return; // Skip this item/row layout generation completely
        }

        const category = row.Group || "GENERAL PRODUCTS";
        const productNameEng = row["Product Name"] || "Unnamed Product";

        if (!productTree[category]) productTree[category] = {};
        if (!productTree[category][productNameEng]) {
          productTree[category][productNameEng] = {
            meta: {
              hsn: getSpreadsheetValue(row, ["HSN Code", "hsn_code"]) || "—",
              descEng: getSpreadsheetValue(row, ["Eng_description", "eng_description"]),
              productNameHindi: getSpreadsheetValue(row, ["Hindi_Product Name", "hindi_product_name"]),
              descHindi: getSpreadsheetValue(row, ["Hindi_description", "hindi_description"]),
              bulletsHindi: getSpreadsheetValue(row, ["Hindi_Bullet points text", "Hindi_bullet_points", "hindi_bullet_points_text"]),
              image: row["product_image"] || ""
            },
            variants: []
          };
        }

        productTree[category][productNameEng].variants.push({
          packSize: row.Pack || "—",
          dlpPrice: row.DLP || "—",
          gstPct: row["GST %"] || "18%",
          gstVal: row.GST || "—",
          totalVal: row.Total || "—",
          mrpPrice: row.MRP || "—",
          shipmentPack: row["Ship Pack"] || "—"
        });
      });

      // Check if visible rows are left after filtering
      if (Object.keys(productTree).length === 0) {
        loader.style.display = "none";
        dataContainer.innerHTML = "<h2>No matching visible data records found in the spreadsheet view.</h2>";
        return;
      }

      let html = "";
      let overallProductCounter = 0;

      for (const categoryName in productTree) {
        html += `
          <div class="category-section">
            <div class="category-header"><h2>${categoryName.toUpperCase()}</h2></div>
        `;

        for (const productNameEng in productTree[categoryName]) {
          const product = productTree[categoryName][productNameEng];
          overallProductCounter++;

          let processedBullets = "";
          if (product.meta.bulletsHindi) {
            const rawString = String(product.meta.bulletsHindi);
            const structuralLines = rawString.split(/[\n•]+/);
            const cleanLines = structuralLines.map(l => l.trim().replace(/^[•\-\*\s]+/, "")).filter(l => l !== "");
            if (cleanLines.length > 0) {
              // REMOVED THE HARDCODED BULLET CHARACTER FROM THE LI TEXT STRING HERE:
              processedBullets = `<ul class="hindi-bullet-list">` + cleanLines.map(l => `<li>${l}</li>`).join('') + `</ul>`;
            }
          }
          
          html += `
            <div class="product-row">
              <div class="prod-details-col">
                <div class="prod-title-block">
                  <h3>${productNameEng}</h3>
                  ${product.meta.productNameHindi ? `<span class="title-hindi">(${product.meta.productNameHindi})</span>` : ''}
                  <span class="hsn-code">HSN Code - ${product.meta.hsn}</span>
                </div>
                ${product.meta.descEng ? `<div class="prod-desc-english">${product.meta.descEng}</div>` : ''}
                ${(product.meta.descHindi || processedBullets) ? `
                  <div class="prod-desc-hindi-box">
                    ${product.meta.descHindi ? `<div class="hindi-text-desc">${product.meta.descHindi}</div>` : ''}
                    ${processedBullets}
                  </div>
                ` : ''}
              </div>

              <div class="prod-pricing-col">
                <table class="pricing-table">
                  <thead>
                    <tr>
                      <th>PACK</th><th>DLP</th><th>GST</th><th>TOTAL</th><th>M.R.P.</th><th>SHIP PACK</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${product.variants.map(v => `
                      <tr>
                        <td><strong>${v.packSize}</strong></td>
                        <td>₹${v.dlpPrice}</td>
                        <td>₹${v.gstVal} <small>(${v.gstPct})</small></td>
                        <td><strong>₹${v.totalVal}</strong></td>
                        <td>₹${v.mrpPrice}</td>
                        <td>${v.shipmentPack}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>

              <div class="prod-image-col">
                ${product.meta.image ? `<img src="${product.meta.image}" alt="${productNameEng}">` : '<div class="no-img">No Image</div>'}
              </div>
            </div>
          `;

          if (overallProductCounter === 3) {
            html += `<div class="forced-page-break"></div>`;
          } else if (overallProductCounter > 3 && (overallProductCounter - 3) % 4 === 0) {
            html += `<div class="forced-page-break"></div>`;
          }
        }
        html += `</div>`;
      }

      setTimeout(() => {
        loader.style.display = "none";
        dataContainer.innerHTML = html;
      }, 300);

    })
    .catch(err => {
      loader.style.display = "none";
      dataContainer.innerHTML = "<h2>Fatal Application Error Loading Spreadsheet Stream Data</h2>";
      console.error(err);
    });
}
