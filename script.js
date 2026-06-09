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

// --- TIMEOUT SECURITY ENGINE CONFIGURATION ---
let sessionTimeoutTimer;
const TIMEOUT_DURATION = 300000; // UPDATED: 5 minutes in milliseconds (5 * 60 * 1000)

// Page initialization lifecycle check
document.addEventListener("DOMContentLoaded", () => {
  if (sessionStorage.getItem("isLoggedIn") === "true") {
    loginOverlay.style.display = "none";
    startDataLoaderEngine();
    startSessionTimeoutTracker(); // Start monitoring activity once logged in
  } else {
    // Setup the mischievous button listeners if we are on the login page
    initMischievousButton();
  }
});

// --- AUTOMATED SESSION TIMEOUT ENGINE ---
function startSessionTimeoutTracker() {
  // Clear any existing timers first to prevent memory duplicates
  clearTimeout(sessionTimeoutTimer);

  // Set the structural trigger to fire after 5 minutes of total inactivity
  sessionTimeoutTimer = setTimeout(() => {
    triggerAutoLogout();
  }, TIMEOUT_DURATION);

  // List of user actions that count as "activity" to reset the 5-minute countdown
  const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
  
  const resetTimerOnActivity = () => {
    clearTimeout(sessionTimeoutTimer);
    sessionTimeoutTimer = setTimeout(() => {
      triggerAutoLogout();
    }, TIMEOUT_DURATION);
  };

  // Bind the event triggers globally to the DOM window tree
  activityEvents.forEach(event => {
    window.addEventListener(event, resetTimerOnActivity, { passive: true });
  });
}

function triggerAutoLogout() {
  // Clear authorization credentials instantly
  sessionStorage.removeItem("isLoggedIn");
  
  // Reset structural display views to lock the application state
  appContainer.style.display = "none";
  loginOverlay.style.display = "flex";
  
  // Show a clean timeout message inside your existing error card component
  loginError.textContent = "Session timed out due to 5 minutes of inactivity. Please re-authenticate.";
  loginError.style.display = "block";
  
  // Reset input fields securely
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
}

// --- MISCHIEVOUS RUNAWAY BUTTON LOGIC ---
function initMischievousButton() {
  const loginForm = document.getElementById("loginForm");
  const btn = loginForm.querySelector(".login-btn");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");

  btn.style.transition = "transform 0.2s ease, background-color 0.2s ease";

  const isFormInvalid = () => {
    return usernameInput.value.trim() === "" || passwordInput.value.trim() === "";
  };

  btn.addEventListener("mouseover", () => {
    if (isFormInvalid()) {
      btn.style.backgroundColor = "#D32F2F"; 
      const randomX = (Math.random() - 0.5) * 180; 
      const randomY = (Math.random() - 0.5) * 80;  
      btn.style.transform = `translate(${randomX}px, ${randomY}px)`;
    }
  });

  const resetButton = () => {
    if (!isFormInvalid()) {
      btn.style.transform = "translate(0px, 0px)";
      btn.style.backgroundColor = ""; 
    }
  };

  usernameInput.addEventListener("input", resetButton);
  passwordInput.addEventListener("input", resetButton);
}

// Form processing router
function handleLogin(event) {
  event.preventDefault();
  const userField = document.getElementById("username").value.trim();
  const passField = document.getElementById("password").value.trim();

  if (userField === correctUsername && passField === correctPassword) {
    loginError.style.display = "none";
    loginOverlay.style.display = "none";
    sessionStorage.setItem("isLoggedIn", "true");
    startDataLoaderEngine();
    startSessionTimeoutTracker(); // Kick off tracker on successful interface submission
  } else {
    loginError.textContent = "Invalid username or password. Access Denied.";
    loginError.style.display = "block";
    document.getElementById("password").value = ""; 
    
    const btn = document.querySelector(".login-btn");
    btn.style.transform = "translate(0px, 0px)";
    btn.style.backgroundColor = "";
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
        const isVisible = row["Visible"] !== undefined ? row["Visible"] : row["visible"];
        if (isVisible && String(isVisible).trim().toLowerCase() === "no") {
          return; 
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

      if (Object.keys(productTree).length === 0) {
        loader.style.display = "none";
        dataContainer.innerHTML = "<h2>No matching visible data records found in the spreadsheet view.</h2>";
        return;
      }

      let html = "";

      for (const categoryName in productTree) {
        html += `
          <div class="category-section">
            <div class="category-header"><h2>${categoryName.toUpperCase()}</h2></div>
        `;

        for (const productNameEng in productTree[categoryName]) {
          const product = productTree[categoryName][productNameEng];

          let processedBullets = "";
          if (product.meta.bulletsHindi) {
            const rawString = String(product.meta.bulletsHindi);
            const structuralLines = rawString.split(/[\n•]+/);
            const cleanLines = structuralLines.map(l => l.trim().replace(/^[•\-\*\s]+/, "")).filter(l => l !== "");
            if (cleanLines.length > 0) {
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
