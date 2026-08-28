let db;
let signupData = {}; // 1. Make this global so both functions can use it

// 0. OPEN DATABASE
let request = indexedDB.open("IN_Vault", 1);

request.onupgradeneeded = function(e) {
    db = e.target.result;
    db.createObjectStore("files", {keyPath: "name"});
}

request.onsuccess = function(e) {
    db = e.target.result;
    loadFiles();
}

request.onerror = function(e) {
    console.error("DB Error:", e.target.error);
}

// 1. SIGNUP STEP 1 - SAVE DATA THEN GO TO NEXT PAGE
function Continue() {
    let f = document.getElementById("firstName").value;
    let s = document.getElementById("secondName").value;
    let a = document.getElementById("age").value;
    let p = document.getElementById("password").value;
    let u = document.getElementById("username").value;
    let hasLetter = /[a-zA-Z]/.test(p);
    let hasNumber = /[0-9]/.test(p);

    if(!f ||!s ||!a ||!p ||!u){
        document.getElementById("error").innerText = "Please enter every required information!"; return;
    }else if(a < 6 || a > 60){
        document.getElementById("error").innerText = "Age must be between 6-60"; return;
    }else if(p.length < 6 || p.length > 14){
        document.getElementById("error").innerText = "Password is required to have between 6-14 characters"; return;
    }else if(!hasLetter ||!hasNumber){
        document.getElementById("error").innerText = "Password must contain both Letters and Numbers"; return;
    }else{
        // 2. SAVE DATA TO GLOBAL VARIABLE FIRST
        signupData = {firstName: f, secondName: s, age: a, password: p, username: u};

        setTimeout(function(){
            window.location.href = "2signup.html";
        },1000);
    }
}

// 2. SIGNUP STEP 2 - SAVE TO LOCALSTORAGE FOR GOOD
function finishSignup(){
    let i = document.getElementById("agreeBox");

    if(!i.checked){
        document.getElementById("warning").innerText = "You have to agree to the terms and condtion to continue"; return;
    }

    // 3. NOW SAVE IT. This was in the wrong place before
    localStorage.setItem("INappUser", signupData.username); // just save username
    localStorage.setItem("INappPass_" + signupData.username, signupData.password); // save password

    alert("Account created for " + signupData.username);
    window.location.href = "home.html";
}

// 4. MENU TOGGLE - Only 1 copy now
function toggleDropdown() {
  document.getElementById("dropdownMenu").classList.toggle("show");
}

window.onclick = function(event) {
  if (!event.target.closest('.menu-container')) {
    document.getElementById("dropdownMenu").classList.remove("show");
  }
}

// 5. UPLOAD NEW FILE
function uploadFile() {
  document.getElementById("uploadInput").click();
}

function saveFile(event) {
  let file = event.target.files[0];
  if(!file) return;

  let reader = new FileReader();
  reader.onload = function(e){
    let tx = db.transaction("files", "readwrite");
    let store = tx.objectStore("files");
    store.put({name: file.name, data: e.target.result});

    tx.oncomplete = function() {
        alert(file.name + " saved to vault");
        loadFiles();
    }
  }
  reader.readAsDataURL(file);
}

// 6. DELETE FILE FROM DROPDOWN
function openFileSelector() {
  document.getElementById("hiddenFileInput").click();
  toggleDropdown();
}

function deleteSelectedFile(event) {
  let fileName = event.target.files[0].name;

  let tx = db.transaction("files", "readwrite");
  tx.objectStore("files").delete(fileName);

  tx.oncomplete = function() {
    alert(fileName + " deleted from vault");
    loadFiles();
  }
}

// 7. LOAD AND SHOW ALL FILES
function loadFiles() {
    if(!db) return;
    let tx = db.transaction("files", "readonly");
    let store = tx.objectStore("files");
    let list = document.getElementById("fileList");
    if(!list) return; // don't crash if we're not on home.html

    store.getAll().onsuccess = function(e){
        let files = e.target.result;
        list.innerHTML = "";

        if(files.length === 0){
            list.innerHTML = "<li class='empty'>No files yet. Click '+ Upload File'</li>";
            return;
        }

        files.forEach(file => {
            list.innerHTML += `
                <li class="file-item">
                    <a href="${file.data}" download="${file.name}">📄 ${file.name}</a>
                    <button class="delBtn" onclick="deleteFile('${file.name}')">Delete</button>
                </li>
            `;
        })
    }
}

// Delete button next to each file
function deleteFile(name) {
    let tx = db.transaction("files", "readwrite");
    tx.objectStore("files").delete(name);
    tx.oncomplete = function() {
        loadFiles();
    }
}

// 8. LOGOUT - fixed to match index.html
function logout() {
  localStorage.removeItem("INappUser"); // was "loggedInUser" before
  window.location.href = "index.html";
}