
let itemsArray = JSON.parse(localStorage.getItem('todos')) || [];
let displayMode = 'all';
let selectedItemIndex = null;
let targetRemovalIndex = null;

const inputField = document.getElementById('userInput');
const errorDisplay = document.getElementById('inputError');
const submitButton = document.getElementById('submitBtn');
const listContainer = document.getElementById('itemsList');
const filterBtns = document.querySelectorAll('.filter-buttons button');
const removeCompletedButton = document.getElementById('removeCompletedBtn');
const removeAllButton = document.getElementById('removeAllBtn');


const modifyModalWindow = document.getElementById('modifyModal');
const modifyInputField = document.getElementById('modifyInput');
const modifyErrorDisplay = document.getElementById('modifyError');
const applyButton = document.getElementById('applyBtn');
const dismissEditButton = document.getElementById('dismissEditBtn');

const destroyModalWindow = document.getElementById('destroyModal');
const approveDestroyButton = document.getElementById('approveDestroyBtn');
const dismissDestroyButton = document.getElementById('dismissDestroyBtn');

const wipeAllModalWindow = document.getElementById('wipeAllModal');
const approveWipeButton = document.getElementById('approveWipeBtn');
const dismissWipeButton = document.getElementById('dismissWipeBtn');

const purgeModalWindow = document.getElementById('purgeModal');
const approvePurgeButton = document.getElementById('approvePurgeBtn');
const dismissPurgeButton = document.getElementById('dismissPurgeBtn');


window.addEventListener('DOMContentLoaded', function() {
    refreshDisplay();
    attachAllListeners();
});


function attachAllListeners() {
    submitButton.addEventListener('click', handleNewItemSubmission);
    
    inputField.addEventListener('keypress', function(evt) {
        if (evt.key === 'Enter') {
            handleNewItemSubmission();
        }
    });

    let idx = 0;
    while (idx < filterBtns.length) {
        filterBtns[idx].addEventListener('click', function(evt) {
            const mode = evt.target.getAttribute('data-type');
            updateDisplayMode(mode);
        });
        idx++;
    }

    removeCompletedButton.addEventListener('click', requestCompletedRemoval);
    removeAllButton.addEventListener('click', requestFullWipe);

    applyButton.addEventListener('click', applyModification);
    dismissEditButton.addEventListener('click', function() {
        toggleModalVisibility(modifyModalWindow, false);
    });

    approveDestroyButton.addEventListener('click', executeItemDestruction);
    dismissDestroyButton.addEventListener('click', function() {
        toggleModalVisibility(destroyModalWindow, false);
    });

    approveWipeButton.addEventListener('click', executeFullWipe);
    dismissWipeButton.addEventListener('click', function() {
        toggleModalVisibility(wipeAllModalWindow, false);
    });

    approvePurgeButton.addEventListener('click', executeCompletedPurge);
    dismissPurgeButton.addEventListener('click', function() {
        toggleModalVisibility(purgeModalWindow, false);
    });
}


function handleNewItemSubmission() {
    const userText = inputField.value.trim();

    if (userText.length === 0) {
        errorDisplay.textContent = '⛔ Task cannot be empty';
        return;
    }

    if (userText.length < 5) {
        errorDisplay.textContent = '⛔ Task must be at least 5 characters long';
        return;
    }

    const initialChar = userText.charAt(0);
    if (initialChar >= '0' && initialChar <= '9') {
        errorDisplay.textContent = '⛔ Task cannot start with a number';
        return;
    }

    const patternCheck = /^[a-zA-Z0-9\s.,'!?-]+$/;
    if (patternCheck.test(userText) === false) {
        errorDisplay.textContent = '⛔ Task must contain only English characters';
        return;
    }

    errorDisplay.textContent = '';
    const itemObject = { text: userText, done: false };
    itemsArray.push(itemObject);
    syncWithStorage();
    inputField.value = '';
    refreshDisplay();
    broadcastMessage('Task added successfully 🎉', 'success');
}


function switchCompletionState(position) {
    const trueIndex = resolveActualIndex(position);
    const targetItem = itemsArray[trueIndex];
    targetItem.done = targetItem.done ? false : true;
    syncWithStorage();
    refreshDisplay();
}


function requestItemModification(position) {
    selectedItemIndex = resolveActualIndex(position);
    modifyErrorDisplay.textContent = '';
    const itemToModify = itemsArray[selectedItemIndex];
    modifyInputField.value = itemToModify.text;
    toggleModalVisibility(modifyModalWindow, true);
}


function applyModification() {
    const modifiedText = modifyInputField.value.trim();

    if (modifiedText.length < 5) {
        modifyErrorDisplay.textContent = '⛔ Task must be at least 5 characters long';
        return;
    }

    itemsArray[selectedItemIndex].text = modifiedText;
    syncWithStorage();
    toggleModalVisibility(modifyModalWindow, false);
    refreshDisplay();
    broadcastMessage('Task has been edited.', 'success');
}


function requestItemDestruction(position) {
    targetRemovalIndex = resolveActualIndex(position);
    toggleModalVisibility(destroyModalWindow, true);
}


function executeItemDestruction() {
    itemsArray.splice(targetRemovalIndex, 1);
    syncWithStorage();
    toggleModalVisibility(destroyModalWindow, false);
    refreshDisplay();
    broadcastMessage('Task has been deleted.', 'success');
}


function requestFullWipe() {
    if (itemsArray.length === 0) {
        broadcastMessage('No tasks to delete.', 'info');
        return;
    }
    toggleModalVisibility(wipeAllModalWindow, true);
}


function executeFullWipe() {
    itemsArray = [];
    syncWithStorage();
    toggleModalVisibility(wipeAllModalWindow, false);
    refreshDisplay();
    broadcastMessage('All tasks have been deleted.', 'success');
}


function requestCompletedRemoval() {
    const finishedItems = itemsArray.filter(function(item) {
        return item.done;
    });
    
    if (finishedItems.length === 0) {
        broadcastMessage('No done tasks to delete.', 'info');
        return;
    }
    toggleModalVisibility(purgeModalWindow, true);
}


function executeCompletedPurge() {
    itemsArray = itemsArray.filter(function(item) {
        return !item.done;
    });
    syncWithStorage();
    toggleModalVisibility(purgeModalWindow, false);
    refreshDisplay();
    broadcastMessage('All done tasks have been deleted.', 'success');
}


function updateDisplayMode(mode) {
    displayMode = mode;
    
    let counter = 0;
    while (counter < filterBtns.length) {
        filterBtns[counter].classList.remove('active');
        counter++;
    }
    
    const selectedBtn = document.querySelector('[data-type="' + mode + '"]');
    selectedBtn.classList.add('active');
    
    refreshDisplay();
}


function refreshDisplay() {
    let visibleItems = itemsArray;

    if (displayMode === 'done') {
        visibleItems = itemsArray.filter(function(item) {
            return item.done;
        });
    } else if (displayMode === 'todo') {
        visibleItems = itemsArray.filter(function(item) {
            return !item.done;
        });
    }

    if (visibleItems.length === 0) {
        listContainer.innerHTML = 'No Tasks 📝';
        return;
    }

    listContainer.innerHTML = '';
    
    let position = 0;
    while (position < visibleItems.length) {
        const currentItem = visibleItems[position];
        
        const itemElement = document.createElement('li');
        const statusClass = currentItem.done ? ' done' : '';
        itemElement.className = 'todo-item' + statusClass;
        
        const textElement = document.createElement('span');
        textElement.textContent = currentItem.text;
        
        const controlsElement = document.createElement('div');
        controlsElement.className = 'todo-actions';
        
        const statusButton = document.createElement('button');
        statusButton.className = 'toggle';
        const iconMarkup = currentItem.done ? 
            '<i class="fa-regular fa-square-check"></i>' : 
            '<i class="fa-regular fa-square"></i>';
        statusButton.innerHTML = iconMarkup;
        
        (function(pos) {
            statusButton.addEventListener('click', function() {
                switchCompletionState(pos);
            });
        })(position);
        
        const modifyButton = document.createElement('button');
        modifyButton.className = 'edit';
        modifyButton.innerHTML = '<i class="fa-solid fa-pen"></i>';
        
        (function(pos) {
            modifyButton.addEventListener('click', function() {
                requestItemModification(pos);
            });
        })(position);
        
        const removeButton = document.createElement('button');
        removeButton.className = 'delete';
        removeButton.innerHTML = '<i class="fa-solid fa-trash"></i>';
        
        (function(pos) {
            removeButton.addEventListener('click', function() {
                requestItemDestruction(pos);
            });
        })(position);
        
        controlsElement.appendChild(statusButton);
        controlsElement.appendChild(modifyButton);
        controlsElement.appendChild(removeButton);
        
        itemElement.appendChild(textElement);
        itemElement.appendChild(controlsElement);
        
        listContainer.appendChild(itemElement);
        
        position++;
    }
}


function resolveActualIndex(displayPosition) {
    let visibleItems = itemsArray;
    
    if (displayMode === 'done') {
        visibleItems = itemsArray.filter(function(item) {
            return item.done;
        });
    } else if (displayMode === 'todo') {
        visibleItems = itemsArray.filter(function(item) {
            return !item.done;
        });
    }
    
    const targetItem = visibleItems[displayPosition];
    
    let searchIndex = 0;
    while (searchIndex < itemsArray.length) {
        if (itemsArray[searchIndex] === targetItem) {
            return searchIndex;
        }
        searchIndex++;
    }
    
    return -1;
}


function toggleModalVisibility(modalElement, shouldShow) {
    if (shouldShow) {
        modalElement.style.display = 'flex';
    } else {
        modalElement.style.display = 'none';
    }
}


function broadcastMessage(messageText, messageCategory) {
    const mainContainer = document.querySelector('.container');
    const existingAlert = mainContainer.querySelector('.message-box');
    
    if (existingAlert) {
        mainContainer.removeChild(existingAlert);
    }

    const alertBox = document.createElement('div');
    alertBox.className = 'message-box ' + messageCategory;
    alertBox.textContent = messageText;
    
    mainContainer.appendChild(alertBox);

    setTimeout(function() {
        if (alertBox.parentNode) {
            mainContainer.removeChild(alertBox);
        }
    }, 3000);
}


function syncWithStorage() {
    const dataString = JSON.stringify(itemsArray);
    localStorage.setItem('todos', dataString);
}
