const electron = require("electron");
const url = require("url");
const path = require("path");
const mongoose = require("mongoose");
const { app, BrowserWindow, Menu, ipcMain, ipcRenderer } = electron;
mongoose.connect(
  "mongodb://korni007:f0d3f252@ds157864.mlab.com:57864/api-benchmark",
  { useNewUrlParser: true }
);
const testSchema = new mongoose.Schema({
  name: String,
  log: String,
  date: {
    type: Date,
    default: Date.now
  }
});
const Test = mongoose.model("Test", testSchema);
//SET ENV
// process.env.NODE_ENV = "production";

let mainWindow;
let addWindow;
let historyWindow;
let resultsWindow;
//Listen for app to be ready
app.on("ready", function() {
  //Create new window
  mainWindow = new BrowserWindow({});
  //Load html into window
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "mainWindow.html"),
      protocol: "file:",
      slashes: true
    })
  );
  //Quit app when closed
  mainWindow.on("closed", function() {
    app.quit();
  });
  //Build menu from template
  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  //Insert menu
  Menu.setApplicationMenu(mainMenu);
});
function createHistoryWindow() {
  historyWindow = new BrowserWindow({
    width: 600,
    height: 800,
    title: "Poprzednie testy"
  });
  //Load html into window
  historyWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "historyWindow.html"),
      protocol: "file:",
      slashes: true
    })
  );
  let data;
  Test.find().then(res => {
    data = res;
  });
  historyWindow.webContents.on("did-finish-load", (event, url) => {
    historyWindow.webContents.send("history_data", data);
  });
  //Garbage collection handle
  historyWindow.on("close", function() {
    historyWindow = null;
  });
}
//Handle create add window
function createAddWindow() {
  //Create new window
  addWindow = new BrowserWindow({
    width: 600,
    height: 800,
    title: "Dodaj test"
  });
  //Load html into window
  addWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "addWindow.html"),
      protocol: "file:",
      slashes: true
    })
  );
  //Garbage collection handle
  addWindow.on("close", function() {
    addWindow = null;
  });
}
//Catch test:add
ipcMain.on("test:add", function(e, test) {
  mainWindow.webContents.send("test:add", test);
  addWindow.close();
});
ipcMain.on("test:result", function(e, result) {
  console.log(result);
  const test = new Test({
    name: result.testName,
    log: result.log
  });
  test.save(function(err) {
    if (err) console.log(err);
  });
  //Create new window
  resultsWindow = new BrowserWindow({
    width: 600,
    height: 800,
    title: "Wyniki"
  });

  //Load html into window
  resultsWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "resultsWindow.html"),
      protocol: "file:",
      slashes: true
    })
  );
  resultsWindow.webContents.on("did-finish-load", (event, url) => {
    resultsWindow.webContents.send("test:result", result);
  });

  //Garbage collection handle
  resultsWindow.on("close", function() {
    resultsWindow = null;
  });
});
//create menu template
const mainMenuTemplate = [
  {
    label: "Główne Menu",
    submenu: [
      {
        label: "Dodaj test",
        click() {
          createAddWindow();
        }
      },
      {
        label: "Zakończ",
        accelerator: process.platform == "darwin" ? "Command+Q" : "Ctrl+Q",
        click() {
          app.quit();
        }
      }
    ]
  },
  {
    label: "Historyczne dane",
    click() {
      createHistoryWindow();
    }
  }
];
//If mac, add empty object to menu
if (process.platform == "darwin") {
  mainMenuTemplate.unshift({});
}
//Add developer tools item if not in prod
if (process.env.NODE_ENV !== "production") {
  mainMenuTemplate.push({
    label: "Narzędzia deweloperskie",
    submenu: [
      {
        label: "DevTools",
        accelerator: process.platform == "darwin" ? "Command+I" : "Ctrl+I",
        click(item, focusedWindow) {
          focusedWindow.toggleDevTools();
        }
      },
      {
        role: "Odśwież"
      }
    ]
  });
}
