const electron = require("electron");
const url = require("url");
const path = require("path");

const { app, BrowserWindow, Menu, ipcMain, ipcRenderer } = electron;

//SET ENV
// process.env.NODE_ENV = "production";

let mainWindow;
let addWindow;
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
  // console.log("odebralem:" + result);
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
