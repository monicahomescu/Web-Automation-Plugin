function extractTextElements() {
    let textElements = [];

    document.body.querySelectorAll("*").forEach(function(element) {
        if (element.children.length > 0 && element.children.length < element.childNodes.length) {
            element.childNodes.forEach(function(childNode) {
                if (childNode.nodeType === Node.TEXT_NODE && childNode.textContent.trim().length > 0) {
                    let newElement = document.createElement("span");
                    newElement.appendChild(document.createTextNode(childNode.textContent));
                    element.replaceChild(newElement, childNode);
                }
            })
        }
    })

    document.body.querySelectorAll("*").forEach(function(element) {
        if (element.childNodes.length === 1 && element.children.length === 0 && element.innerText.trim().length > 0) {
            textElements.push(element);
        }
    })

    return textElements;
}

function findLargestContainer(element) {
    while (element.parentNode.innerText.trim() === element.innerText.trim()) {
        element = element.parentNode;
    }

    return element;
}

function getColumnNames() {
    headerCells = [];
    let columnNames = [];

    let mainColumnName = null;

    document.body.querySelectorAll("button").forEach(function(button) {
        if (button.innerText.slice(0, 4) === "New ") {
            mainColumnName = button.innerText.slice(4);
        }
    })

    let textElements = extractTextElements();
    let found = false;
    let mainHeaderCell = null;

    textElements.forEach(function(textElement) {
        if (!found && textElement.innerText.toLowerCase() === mainColumnName) {
            mainHeaderCell = findLargestContainer(textElement);

            columnNames.push(mainHeaderCell.innerText.trim());
            headerCells.push(mainHeaderCell);

            found = true;
        }
    })

    let positionMainHeaderCell = mainHeaderCell.getBoundingClientRect();

    textElements.forEach(function(textElement) {
        let potentialHeaderCell = findLargestContainer(textElement);
        let positionPotentialHeaderCell = potentialHeaderCell.getBoundingClientRect();

        if (positionMainHeaderCell.top === positionPotentialHeaderCell.top &&
            positionMainHeaderCell.bottom === positionPotentialHeaderCell.bottom &&
            positionMainHeaderCell.right <= positionPotentialHeaderCell.left) {
            columnNames.push(potentialHeaderCell.innerText.trim());
            headerCells.push(potentialHeaderCell);
        }
    })

    return columnNames;
}

function getGroupNames() {
    groupElements = [];
    let groupNames = [];

    let textElements = extractTextElements();
    let mainColumnName = columnNames[0];
    let positionMainHeaderCell = headerCells[0].getBoundingClientRect();

    textElements.forEach(function(potentialHeader) {
        if (potentialHeader.innerText === mainColumnName) {
            let headerCell = findLargestContainer(potentialHeader);
            let positionHeaderCell = headerCell.getBoundingClientRect();

            if (positionMainHeaderCell.left === positionHeaderCell.left &&
                positionMainHeaderCell.right === positionHeaderCell.right) {
                let found = false;

                textElements.forEach(function(potentialGroup) {
                    let positionPotentialGroup = potentialGroup.getBoundingClientRect();

                    if (!found && positionHeaderCell.top > positionPotentialGroup.bottom &&
                        positionHeaderCell.left < positionPotentialGroup.left &&
                        positionHeaderCell.top - positionPotentialGroup.bottom < 30) {
                        groupNames.push(potentialGroup.innerText);
                        groupElements.push(potentialGroup);

                        found = true;
                    }
                })
            }
        }
    })

    return groupNames;
}

function getAssociatedGroup(element) {
    let groupName = null;
    let positionElement = element.getBoundingClientRect();
    let minimumDistance = 1000;

    groupElements.forEach(function(groupElement) {
        let positionGroupElement = groupElement.getBoundingClientRect();
        let distance = 1000;

        if (positionElement.top > positionGroupElement.bottom) {
            distance = positionElement.top - positionGroupElement.bottom;
        }

        if (distance < minimumDistance) {
            minimumDistance = distance;
            groupName = groupElement.innerText;
        }
    })

    return groupName;
}

function getMainColumnValues(groupName) {
    let mainColumnValues = []

    let positionMainHeaderCell = headerCells[0].getBoundingClientRect();

    document.body.querySelectorAll("*").forEach(function(element) {
        let positionElement = element.getBoundingClientRect();

        if (positionMainHeaderCell.left === positionElement.left && positionMainHeaderCell.right === positionElement.right &&
            getAssociatedGroup(element) === groupName && element.innerText.trim().length > 0 &&
            !mainColumnValues.includes(element.innerText.trim())) {
            mainColumnValues.push(element.innerText.trim());
        }
    })

    mainColumnValues = mainColumnValues.slice(1);

    return mainColumnValues;
}

function getBoardNameElement() {
    let boardNameElement = null;
    let maximumFontSize = 0;
    let textElements = extractTextElements();

    textElements.forEach(function(textElement) {
        let elementComputedStyle =  window.getComputedStyle(textElement);
        let elementFontSize = parseFloat(elementComputedStyle.getPropertyValue("font-size"));

        if (elementFontSize > maximumFontSize) {
            maximumFontSize = elementFontSize
            boardNameElement = textElement;
        }
    })

    return boardNameElement;
}

async function renameBoard(oldBoardName, newBoardName) {
    return new Promise((resolve) => {
        if (oldBoardName.trim() === newBoardName.trim() || newBoardName.trim().length === 0) {
            return resolve();
        }

        let boardNameElement = getBoardNameElement();

        boardNameElement.click();

        waitForElementOnPage(`input[value="${oldBoardName}"]`).then((input) => {
            input.value = newBoardName;

            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new KeyboardEvent('keydown',
                {code: 'Enter', key: 'Enter', charCode: 13, keyCode: 13, view: window, bubbles: true}));

            chrome.runtime.sendMessage({data: newBoardName});

            return resolve();
        });
    })
}

async function deleteBoard() {
    return new Promise((resolve) => {
        let boardNameElement = getBoardNameElement();
        let positionBoardName = boardNameElement.getBoundingClientRect();

        document.querySelectorAll("button").forEach(function(button) {
            if (button.ariaLabel === "Options") {
                let positionButton = button.getBoundingClientRect();

                if (positionButton.left > positionBoardName.right && positionButton.top < positionBoardName.bottom) {
                    button.click();
                }
            }
        })

        setTimeout(function () {
            let textElements = extractTextElements();

            textElements.forEach(function(textElement) {
                if (textElement.innerText === "Delete board") {
                    textElement.click();

                    return resolve();
                }
            })
        }, 1000);
    });
}

async function exportBoard() {
    return new Promise((resolve) => {
        let boardNameElement = getBoardNameElement();
        let positionBoardName = boardNameElement.getBoundingClientRect();

        document.querySelectorAll("button").forEach(function(button) {
            if (button.ariaLabel === "Options") {
                let positionButton = button.getBoundingClientRect();

                if (positionButton.left > positionBoardName.right && positionButton.top < positionBoardName.bottom) {
                    button.click();
                }
            }
        })

        setTimeout(function () {
            let textElements = extractTextElements();

            textElements.forEach(function(textElement) {
                if (textElement.innerText === "More actions") {
                    textElement.addEventListener('mouseover', function() {});
                    let event = new MouseEvent('mouseover',
                        {'view': window, 'bubbles': true, 'cancelable': true});
                    textElement.dispatchEvent(event);

                    setTimeout(function () {
                        let textElements = extractTextElements();

                        textElements.forEach(function(textElement) {
                            if (textElement.innerText === "Export board to Excel") {
                                textElement.click();

                                setTimeout(function () {
                                    document.body.querySelectorAll("button").forEach(function(button) {
                                        if (button.innerText === "Export") {
                                            button.click();

                                            return resolve();
                                        }
                                    })
                                }, 1000);
                            }
                        })
                    }, 1000);
                }
            })

        }, 1000);
    });
}

async function addGroup(newGroupName) {
    return new Promise((resolve) => {
        document.querySelectorAll('button').forEach(function(button) {
            if (button.innerText === "Add new group") {
                button.click();

                waitForElementOnPage('input[value="New Group"]').then((input) => {
                    if (newGroupName.trim().length > 0 && newGroupName.trim() !== "New Group") {
                        input.value = newGroupName;
                    }

                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new KeyboardEvent('keydown',
                        {code: 'Enter', key: 'Enter', charCode: 13, keyCode: 13, view: window, bubbles: true}));

                    return resolve();
                });
            }
        })
    })
}

async function renameGroup(oldGroupName, newGroupName) {
    return new Promise((resolve) => {
        if (oldGroupName.trim() === newGroupName.trim() || newGroupName.trim().length === 0) {
            return resolve();
        }

        groupElements.forEach(function(groupElement) {
            if (groupElement.innerText === oldGroupName) {
                groupElement.click();

                waitForElementOnPage(`input[value="${oldGroupName}"]`).then((input) => {
                    input.value = newGroupName;

                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new KeyboardEvent('keydown',
                        {code: 'Enter', key: 'Enter', charCode: 13, keyCode: 13, view: window, bubbles: true}));

                    return resolve();
                });
            }
        })
    })
}

async function deleteGroup(groupName) {
    return new Promise((resolve) => {
        groupElements.forEach(function(groupElement) {
            if (groupElement.innerText === groupName) {
                let positionGroupName = groupElement.getBoundingClientRect();

                document.querySelectorAll("a").forEach(function(a) {
                    let positionA = a.getBoundingClientRect();

                    if (positionA.right < positionGroupName.left &&
                        positionA.top < positionGroupName.bottom &&
                        positionA.bottom > positionGroupName.top) {
                        a.click();

                        setTimeout(function () {
                            let textElements = extractTextElements();

                            textElements.forEach(function(textElement) {
                                if (textElement.innerText === "Delete") {
                                    textElement.click();

                                    setTimeout(function () {
                                        document.body.querySelectorAll("button").forEach(function(button) {
                                            if (button.innerText === "Delete") {
                                                button.click();

                                                return resolve();
                                            }
                                        })
                                    }, 1000);
                                }
                            })
                        }, 1000);
                    }
                })
            }
        })
    })
}

async function exportGroup(groupName) {
    return new Promise((resolve) => {
        groupElements.forEach(function(groupElement) {
            if (groupElement.innerText === groupName) {
                let positionGroupName = groupElement.getBoundingClientRect();

                document.querySelectorAll("a").forEach(function(a) {
                    let positionA = a.getBoundingClientRect();

                    if (positionA.right < positionGroupName.left &&
                        positionA.top < positionGroupName.bottom &&
                        positionA.bottom > positionGroupName.top) {
                        a.click();

                        setTimeout(function () {
                            let textElements = extractTextElements();

                            textElements.forEach(function(textElement) {
                                if (textElement.innerText === "Export to Excel") {
                                    textElement.click();

                                    setTimeout(function () {
                                        document.body.querySelectorAll("button").forEach(function(button) {
                                            if (button.innerText === "Export") {
                                                button.click();

                                                return resolve();
                                            }
                                        })
                                    }, 1000);
                                }
                            })
                        }, 1000);
                    }
                })
            }
        })
    })
}

function isDateWithWord(dateString) {
    let parts = dateString.split(' ');
    if (parts.length < 2 || parts.length > 3) {
        return false;
    }

    let day = parts[0];
    if (isNaN(day) || day < 1 || day > 31) {
        return false;
    }

    let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let month = parts[1].replace(',', '');
    if (!months.includes(month)) {
        return false;
    }

    if (parts.length === 3) {
        let year = parts[2];
        if (!year.match(/^\d{4}$/)) {
            return false;
        }
    }

    return true;
}

function isDateWithSlash(dateString) {
    let parts = dateString.split('/');
    if (parts.length !== 3) {
        return false;
    }

    let [day, month, year] = parts;
    if (!day.match(/^(0[1-9]|[12][0-9]|3[01])$/) || !month.match(/^(0[1-9]|1[0-2])$/) || !year.match(/^\d{4}$/)) {
        return false;
    }

    return true;
}

function convertDate(dateString) {
    let parts = dateString.split(' ');

    let day = parts[0];
    day = day.padStart(2, '0');

    let monthConversions = {'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06', 'Jul': '07',
        'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
    let month = parts[1].replace(',', '');
    month = monthConversions[month];

    let currentYear = new Date().getFullYear();
    let year = parts.length === 3 ? parts[2] : currentYear;

    return `${day}/${month}/${year}`;
}

function waitForElementOnPage(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                return resolve(document.querySelector(selector));
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function waitForElementInContainer(elements) {
    return new Promise(resolve => {
        if (elements.length === 1) {
            return resolve(elements);
        }

        const observer = new MutationObserver(mutations => {
            if (elements.length === 1) {
                observer.disconnect();
                return resolve(elements);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function enterInputInField(inputValue, inputContainer) {
    return new Promise(resolve => {
        if (isDateWithWord(inputContainer.innerText.trim())) {
            if (convertDate(inputContainer.innerText.trim()) === inputValue.trim()) {
                return resolve();
            }
        }

        if (inputContainer.innerText.trim().length === 0 && inputValue.trim().length > 0) {
            let spanElement = inputContainer.getElementsByTagName("span")[0];

            spanElement.click();
        }
        else if (inputContainer.innerText.trim().length > 0 && inputContainer.innerText.trim() !== inputValue.trim()) {
            let textElement = null;
            inputContainer.querySelectorAll("*").forEach(function(element) {
                if (element.childNodes.length == 1 && element.children.length == 0 &&
                    element.innerText.trim() === inputContainer.innerText.trim()) {
                    textElement = element;
                }
            })

            textElement.click();
        }
        else
            return resolve();

        if (isDateWithSlash(inputValue)) {
            setTimeout(function () {
                let input = null;
                document.querySelectorAll('input').forEach(function(inputElement) {
                    if (isDateWithSlash(inputElement.value)) {
                        input = inputElement;
                    }
                })

                input.value = inputValue;

                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new KeyboardEvent('keydown',
                    {code: 'Enter', key: 'Enter', charCode: 13, keyCode: 13, view: window, bubbles: true}));

                return resolve();
            }, 1000);
        }
        else {
            if (inputContainer.innerText.trim().length === 0) {
                waitForElementInContainer(inputContainer.getElementsByTagName('input')).then((inputs) => {
                    let input = inputs[0];

                    input.value = inputValue;

                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new KeyboardEvent('keydown',
                        {code: 'Enter', key: 'Enter', charCode: 13, keyCode: 13, view: window, bubbles: true}));

                    return resolve();
                });
            }
            else {
                waitForElementOnPage(`input[value="${inputContainer.innerText.trim()}"]`).then((input) => {
                    input.value = inputValue;

                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new KeyboardEvent('keydown',
                        {code: 'Enter', key: 'Enter', charCode: 13, keyCode: 13, view: window, bubbles: true}));

                    return resolve();
                });
            }
        }
    })
}

async function fillOutRow(parameters, rowCells) {
    let promises = [];

    for (let i = 0; i < rowCells.length; i++) {
        promises.push(enterInputInField(parameters[columnNames[i]], rowCells[i]));
        await promises[promises.length - 1];
    }

    return Promise.all(promises);
}

function getRowCells(groupName, mainColumnValue) {
    let rowCells = [];

    let positionMainHeaderCell = headerCells[0].getBoundingClientRect();
    let positionMainCell = null;

    document.body.querySelectorAll("*").forEach(function(element) {
        let positionElement = element.getBoundingClientRect();

        if (positionMainHeaderCell.left === positionElement.left && positionMainHeaderCell.right === positionElement.right &&
            getAssociatedGroup(element) === groupName && element.innerText.trim() === mainColumnValue) {
            positionMainCell = positionElement;
        }
    })

    headerCells.forEach(function(headerCell) {
        let positionHeaderCell = headerCell.getBoundingClientRect();
        let found = false;

        document.body.querySelectorAll("*").forEach(function(element) {
            let positionElement = element.getBoundingClientRect();

            if (!found && positionHeaderCell.left === positionElement.left && positionHeaderCell.right === positionElement.right &&
                positionMainCell.top === positionElement.top && positionMainCell.bottom === positionElement.bottom) {
                rowCells.push(element);

                found = true;
            }
        })
    })

    return rowCells;
}

async function addRow(groupName, parameters) {
    return new Promise(async (resolve) => {
        document.body.querySelectorAll("input").forEach(function (input) {
            if (input.getAttribute("placeholder") === "+ Add " + columnNames[0].toLowerCase() &&
                getAssociatedGroup(input) === groupName) {
                input.value = parameters[columnNames[0]];

                input.dispatchEvent(new Event('input', {bubbles: true}));
                input.dispatchEvent(new KeyboardEvent('keydown',
                    {code: 'Enter', key: 'Enter', charCode: 13, keyCode: 13, view: window, bubbles: true}));
            }
        })

        setTimeout(async function(){
            let rowCells = getRowCells(groupName, parameters[columnNames[0]]);

            await fillOutRow(parameters, rowCells);

            return resolve();
        }, 2000);
    })
}

function getRowValues(groupName, mainColumnValue) {
    let rowValues = [];

    let rowCells = getRowCells(groupName, mainColumnValue);

    rowCells.forEach(function(rowCell) {
        let cellValue = rowCell.innerText.trim();

        if (isDateWithWord(cellValue)) {
            cellValue = convertDate(cellValue);
        }

        rowValues.push(cellValue);
    })

    return rowValues;
}

async function updateRow(groupName, parameters) {
    return new Promise(async (resolve) => {
        let oldKey = "old" + columnNames[0];
        let oldMainColumnValue = parameters[oldKey];
        delete parameters[oldKey];

        let rowCells = getRowCells(groupName, oldMainColumnValue);

        await fillOutRow(parameters, rowCells);

        return resolve();
    })
}

function clickRowCheckbox(groupName, mainColumnValue) {
    let positionMainHeaderCell = headerCells[0].getBoundingClientRect();
    let mainCell = null;
    let found = false;

    document.body.querySelectorAll("*").forEach(function(element) {
        let positionElement = element.getBoundingClientRect();

        if (!found && positionMainHeaderCell.left === positionElement.left && positionMainHeaderCell.right === positionElement.right &&
            getAssociatedGroup(element) === groupName && element.innerText.trim() === mainColumnValue) {
            mainCell = element;

            found = true;
        }
    })

    let rowCheckbox = mainCell.getElementsByTagName("input")[0];

    rowCheckbox.click();
}

async function startDeleteRow(groupName, parameters) {
    return new Promise((resolve) => {
        clickRowCheckbox(groupName, parameters[columnNames[0]]);

        return resolve();
    })
}

function clickDeleteButton() {
    return new Promise((resolve) => {
        let textElements = extractTextElements();

        textElements.forEach(function(textElement) {
            if (textElement.innerText === "Delete") {
                textElement.click();

                return resolve();
            }
        })
    })
}

function clickConfirmButton() {
    return new Promise((resolve) => {
        document.body.querySelectorAll("button").forEach(function(button) {
            if (button.innerText.trim() === "Delete") {
                button.click();

                return resolve();
            }
        })
    })
}

async function finishDeleteRow() {
    return new Promise((resolve) => {
        setTimeout(async function () {
            await clickDeleteButton();
        }, 1000);

        setTimeout(async function () {
            await clickConfirmButton();
        }, 3000);

        return resolve();
    })
}

let columnNames = [];
let headerCells = [];

let groupNames = [];
let groupElements = []

let mainColumnValues = [];
let currentlySelectedGroup = null;

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === "startAnalyzing") {
        console.log("Message was received from popup script: startAnalyzing");

        sendResponse({data: getBoardNameElement().innerText});

        columnNames = getColumnNames();
        chrome.storage.local.set({"columnsStorage": columnNames}, function () {
            console.log("Columns storage was set: " + columnNames);
        })

        groupNames = getGroupNames();
        chrome.storage.local.set({"groupsStorage": groupNames}, function () {
            console.log("Groups storage was set: " + groupNames);
        })

        mainColumnValues = getMainColumnValues(message.group);
        chrome.storage.local.set({"rowsStorage": mainColumnValues}, function() {
            console.log("Rows storage was set: " + mainColumnValues);
        })
    }
    else if (message.action === "updateRowsStorage") {
        console.log("Message was received from popup script: updateRowsStorage");

        currentlySelectedGroup = message.group;

        mainColumnValues = getMainColumnValues(message.group);
        chrome.storage.local.set({"rowsStorage": mainColumnValues}, function() {
            console.log("Rows storage was set: " + mainColumnValues);
        })
    }
    else if (message.action === "retrieveRowValues") {
        console.log("Message was received from popup script: retrieveRowValues");

        let rowValues = getRowValues(message.group, message.row);

        sendResponse({data: rowValues});
    }
    else if (message.action === "executeOperations") {
        console.log("Message was received from popup script: executeOperations");

        chrome.storage.local.get(["operationsStorage"], async function (result) {
            console.log("Operations storage was retrieved: " + result.operationsStorage);

            let promises = [];
            let operationsJson = JSON.parse(result.operationsStorage);
            let deleteExists = false;
            let groupsChanged = false;
            let rowsChanged = false;

            for (let operationJson of operationsJson) {
                if ("Rename board" in operationJson) {
                    let parameters = operationJson["Rename board"];

                    promises.push(renameBoard(parameters["oldName"], parameters["newName"]));
                    await promises[promises.length - 1];
                }
                else if ("Delete board" in operationJson) {
                    promises.push(deleteBoard(operationJson["Delete board"]));
                    await promises[promises.length - 1];
                }
                else if ("Export board" in operationJson) {
                    promises.push(exportBoard(operationJson["Export board"]));
                    await promises[promises.length - 1];
                }
                else if ("Add group" in operationJson) {
                    groupsChanged = true;

                    promises.push(addGroup(operationJson["Add group"]));
                    await promises[promises.length - 1];
                }
                else if ("Rename group" in operationJson) {
                    groupsChanged = true;

                    let parameters = operationJson["Rename group"];

                    promises.push(renameGroup(parameters["oldName"], parameters["newName"]));
                    await promises[promises.length - 1];
                }
                else if ("Delete group" in operationJson) {
                    groupsChanged = true;

                    promises.push(deleteGroup(operationJson["Delete group"]));
                    await promises[promises.length - 1];
                }
                else if ("Export group" in operationJson) {
                    promises.push(exportGroup(operationJson["Export group"]));
                    await promises[promises.length - 1];
                }
                else if ("Add" in operationJson) {
                    rowsChanged = true;

                    promises.push(addRow(operationJson["Group"], operationJson["Add"]));
                    await promises[promises.length - 1];
                } else if ("Update" in operationJson) {
                    rowsChanged = true;

                    promises.push(updateRow(operationJson["Group"], operationJson["Update"]));
                    await promises[promises.length - 1];
                } else if ("Delete" in operationJson) {
                    rowsChanged = true;
                    deleteExists = true;

                    promises.push(startDeleteRow(operationJson["Group"], operationJson["Delete"]));
                    await promises[promises.length - 1];
                }
            }

            if (deleteExists) {
                promises.push(finishDeleteRow());
                await promises[promises.length - 1];
            }

            Promise.all(promises).then(() => {
                if (groupsChanged) {
                    setTimeout(function () {
                        groupNames = getGroupNames();

                        chrome.storage.local.set({"groupsStorage": groupNames}, function () {
                            console.log("Groups storage was set: " + groupNames);
                        })
                    }, 3000);
                }

                if (rowsChanged) {
                    let timeout = 1000;
                    if (deleteExists) {
                        timeout += 3000;
                    }

                    setTimeout(function () {
                        mainColumnValues = getMainColumnValues(currentlySelectedGroup);

                        chrome.storage.local.set({"rowsStorage": mainColumnValues}, function() {
                            console.log("Rows storage was set: " + mainColumnValues);
                        })
                    }, timeout);
                }
            });
        })
    }
})
