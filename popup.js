function filterDropdownOptions(inputElement, optionsContainer) {
    let inputValue = inputElement.value.toUpperCase();
    let optionButtons = optionsContainer.getElementsByTagName("button");

    for (let i = 0; i < optionButtons.length; i++) {
        let buttonValue = optionButtons[i].innerText;

        if (buttonValue.toUpperCase().indexOf(inputValue) > -1) {
            optionButtons[i].style.display = "";
        } else {
            optionButtons[i].style.display = "none";
        }
    }
}

function configureButtonBehaviour(name) {
    let button = document.getElementById(name + "Button");
    let dropdown = document.getElementById(name + "Dropdown");
    let input = document.getElementById(name + "Input");
    let options = document.getElementById(name + "Options");

    button.addEventListener("mouseenter", function() {
        dropdown.classList.add("show");

        input.addEventListener("keyup", function() {
            filterDropdownOptions(input, options);
        })
    });

    button.addEventListener("mouseleave", function() {
        setTimeout(function() {
            if (!button.matches(':hover') && !dropdown.matches(':hover')) {
                dropdown.classList.remove("show");
            }
        }, 100);
    });

    dropdown.addEventListener("mouseenter", function() {
        dropdown.classList.add("show");
    });

    dropdown.addEventListener("mouseleave", function() {
        setTimeout(function() {
            if (!button.matches(':hover') && !dropdown.matches(':hover')) {
                dropdown.classList.remove("show");
            }
        }, 100);
    });
}

function addOptionsToGroupDropdown(groupOptions) {
    let renameGroupOptions = document.getElementById("renameGroupOptions");
    let deleteGroupOptions = document.getElementById("deleteGroupOptions");
    let exportGroupOptions = document.getElementById("exportGroupOptions");
    let operationsTextarea = document.getElementById("operationsTextarea");

    renameGroupOptions.innerHTML = "";
    deleteGroupOptions.innerHTML = "";
    exportGroupOptions.innerText = "";

    groupOptions.forEach(function(groupOption) {
        let renameGroupButton = document.createElement("button");
        renameGroupButton.innerText = groupOption;

        let deleteGroupButton = document.createElement("button");
        deleteGroupButton.innerText = groupOption;

        let exportGroupButton = document.createElement("button");
        exportGroupButton.innerText = groupOption;

        renameGroupButton.addEventListener("click", function () {
            let renameGroupJson = {};
            renameGroupJson["oldName"] = groupOption;
            renameGroupJson["newName"] = "";

            let operationsJson = JSON.parse(operationsTextarea.value);
            operationsJson.push({"Rename group": renameGroupJson});
            operationsTextarea.value = JSON.stringify(operationsJson);

            saveOperationsToStorage();
        })

        deleteGroupButton.addEventListener("click", function () {
            let operationsJson = JSON.parse(operationsTextarea.value);
            operationsJson.push({"Delete group": groupOption});
            operationsTextarea.value = JSON.stringify(operationsJson);

            saveOperationsToStorage();
        })

        exportGroupButton.addEventListener("click", function () {
            let operationsJson = JSON.parse(operationsTextarea.value);
            operationsJson.push({"Export group": groupOption});
            operationsTextarea.value = JSON.stringify(operationsJson);

            saveOperationsToStorage();
        })

        renameGroupOptions.appendChild(renameGroupButton);

        deleteGroupOptions.appendChild(deleteGroupButton);

        exportGroupOptions.appendChild(exportGroupButton);
    });
}

function addOptionsToGroupSelect(groupOptions) {
    let groupsSelect = document.getElementById("groupsSelect");
    groupsSelect.innerHTML = "";

    groupOptions.forEach(function(groupOption) {
        let groupsSelectOption = document.createElement("option");
        groupsSelectOption.innerText = groupOption;

        groupsSelect.appendChild(groupsSelectOption);
    })
}

function addOptionsToRowDropdown(rowOptions) {
    let columnNames = document.getElementById("columnsTextarea").value.split(",");
    let groupsSelect = document.getElementById("groupsSelect");
    let updateRowOptions = document.getElementById("updateRowOptions");
    let deleteRowOptions = document.getElementById("deleteRowOptions");
    let operationsTextarea = document.getElementById("operationsTextarea");

    updateRowOptions.innerHTML = "";
    deleteRowOptions.innerHTML = "";

    rowOptions.forEach(function(rowOption) {
        let updateRowButton = document.createElement("button");
        updateRowButton.innerText = rowOption;

        let deleteRowButton = document.createElement("button");
        deleteRowButton.innerText = rowOption;

        updateRowButton.addEventListener("click", function () {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {action: "retrieveRowValues", group: groupsSelect.value, row: rowOption}, function (response) {
                    let rowValues = response.data;

                    let updateRowJson = {};
                    updateRowJson["old" + columnNames[0]] = rowValues[0];
                    for (let i = 0; i < columnNames.length; i++) {
                        updateRowJson[columnNames[i]] = rowValues[i];
                    }

                    let operationsJson = JSON.parse(operationsTextarea.value);
                    operationsJson.push({"Group": groupsSelect.value, "Update": updateRowJson});
                    operationsTextarea.value = JSON.stringify(operationsJson);

                    saveOperationsToStorage();
                });
            });
        })

        deleteRowButton.addEventListener("click", function () {
            let deleteRowJson = {};
            deleteRowJson[columnNames[0]] = rowOption;

            let operationsJson = JSON.parse(operationsTextarea.value);
            operationsJson.push({"Group": groupsSelect.value, "Delete": deleteRowJson});
            operationsTextarea.value = JSON.stringify(operationsJson);

            saveOperationsToStorage();
        })

        updateRowOptions.appendChild(updateRowButton);

        deleteRowOptions.appendChild(deleteRowButton);
    });
}

function saveOperationsToStorage() {
    let operationsTextarea = document.getElementById("operationsTextarea");

    chrome.storage.local.set({"operationsStorage": operationsTextarea.value}, function() {
        console.log("Operations storage was set: " + operationsTextarea.value);
    })
}

document.addEventListener("DOMContentLoaded", function() {
    let nameTextarea = document.getElementById("nameTextarea");
    let columnsTextarea = document.getElementById("columnsTextarea");
    let groupsSelect = document.getElementById("groupsSelect");
    let operationsTextarea = document.getElementById("operationsTextarea");

    chrome.storage.local.get(["columnsStorage", "groupsStorage", "rowsStorage", "operationsStorage"], function(result) {
        if (typeof result.columnsStorage === "undefined") {
            console.log("Columns storage is empty");
        }
        else {
            console.log("Columns storage already exists: " + result.columnsStorage);

            columnsTextarea.value = result.columnsStorage;
        }

        if (typeof result.groupsStorage === "undefined") {
            console.log("Groups storage is empty");
        }
        else {
            console.log("Groups storage already exists: " + result.groupsStorage);

            addOptionsToGroupSelect(result.groupsStorage);
            addOptionsToGroupDropdown(result.groupsStorage);
        }

        if (typeof result.rowsStorage === "undefined") {
            console.log("Rows storage is empty");
        }
        else {
            console.log("Rows storage already exists: " + result.rowsStorage);

            addOptionsToRowDropdown(result.rowsStorage);
        }

        if (typeof result.operationsStorage === "undefined") {
            console.log("Operations storage is empty");

            operationsTextarea.value = "[]";
        }
        else {
            console.log("Operations storage already exists: " + result.operationsStorage);

            operationsTextarea.value = result.operationsStorage;
        }
    })

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "startAnalyzing", group: groupsSelect.value}, function (response) {
            console.log("Message was sent to content script: startAnalyzing | " + groupsSelect.value);

            nameTextarea.value = response.data;
        });
    });

    chrome.storage.onChanged.addListener(function(changes) {
        if ("columnsStorage" in changes) {
            console.log("Columns storage was changed: " + changes["columnsStorage"].newValue);

            columnsTextarea.value = changes["columnsStorage"].newValue;
        }

        if ("groupsStorage" in changes) {
            console.log("Groups storage was changed: " + changes["groupsStorage"].newValue);

            addOptionsToGroupSelect(changes["groupsStorage"].newValue);
            addOptionsToGroupDropdown(changes["groupsStorage"].newValue);
        }

        if ("rowsStorage" in changes) {
            console.log("Rows storage was changed: " + changes["rowsStorage"].newValue);

            addOptionsToRowDropdown(changes["rowsStorage"].newValue);
        }
    })

    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        nameTextarea.value = message.data;
    })

    document.getElementById("renameBoardButton").addEventListener("click", function() {
        let renameBoardJson = {};
        renameBoardJson["oldName"] = nameTextarea.value;
        renameBoardJson["newName"] = "";

        let operationsJson = JSON.parse(operationsTextarea.value);
        operationsJson.push({"Rename board": renameBoardJson});
        operationsTextarea.value = JSON.stringify(operationsJson);

        saveOperationsToStorage();
    })

    document.getElementById("deleteBoardButton").addEventListener("click", function() {
        let operationsJson = JSON.parse(operationsTextarea.value);
        operationsJson.push({"Delete board": nameTextarea.value});
        operationsTextarea.value = JSON.stringify(operationsJson);

        saveOperationsToStorage();
    })

    document.getElementById("exportBoardButton").addEventListener("click", function() {
        let operationsJson = JSON.parse(operationsTextarea.value);
        operationsJson.push({"Export board": nameTextarea.value});
        operationsTextarea.value = JSON.stringify(operationsJson);

        saveOperationsToStorage();
    })

    document.getElementById("addGroupButton").addEventListener("click", function() {
        let operationsJson = JSON.parse(operationsTextarea.value);
        operationsJson.push({"Add group": ""});
        operationsTextarea.value = JSON.stringify(operationsJson);

        saveOperationsToStorage();
    })

    configureButtonBehaviour("renameGroup");

    configureButtonBehaviour("deleteGroup");

    configureButtonBehaviour("exportGroup");

    groupsSelect.addEventListener("change", function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "updateRowsStorage", group: groupsSelect.value});

            console.log("Message was sent to content script: updateRowsStorage | " + groupsSelect.value);
        });
    })
    let observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    chrome.tabs.sendMessage(tabs[0].id, {action: "updateRowsStorage", group: groupsSelect.value});

                    console.log("Message was sent to content script: updateRowsStorage | " + groupsSelect.value);
                });
            }
        });
    });
    observer.observe(groupsSelect, { childList: true });

    document.getElementById("addRowButton").addEventListener("click", function() {
        let addRowJson = {};
        let columnNames = columnsTextarea.value.split(",");
        columnNames.forEach(function(columnName) {
            addRowJson[columnName] = "";
        })
        addRowJson[columnNames[0]] = "New " + columnNames[0].toLowerCase();

        let operationsJson = JSON.parse(operationsTextarea.value);
        operationsJson.push({"Group": groupsSelect.value, "Add": addRowJson});
        operationsTextarea.value = JSON.stringify(operationsJson);

        saveOperationsToStorage();
    })

    configureButtonBehaviour("updateRow");

    configureButtonBehaviour("deleteRow");

    operationsTextarea.addEventListener("change", function() {
        saveOperationsToStorage();
    })

    document.getElementById("executeOperationsButton").addEventListener("click", function () {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "executeOperations"});

            console.log("Message was sent to content script: executeOperations");
        });
    })
    
    document.getElementById("clearOperationsButton").addEventListener("click", function() {
        operationsTextarea.value = "[]";

        chrome.storage.local.set({"operationsStorage": "[]"}, function() {
            console.log("Operations storage was set: []");
        })
    })
})
