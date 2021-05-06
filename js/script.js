'use strict';

(()=>{

    const serverURL = `http://${document.location.hostname}:3000/api/clients`;
    let searchTimeout = null;
    let simpleBar = null;
    const searchWaitTime = 300;
    const cellsDescr = [
        {
            classList: ['row__td','row__id'],
            getContent: getIdHtml,
        },
        {
            classList: ['row__td','row__client'],
            getContent: getFioHtml,
        },
        {
            classList: ['row__td','row__create'],
            getContent: getClientCreateDate,
        },
        {
            classList:['row__td','row__edit'],
            getContent: getClientEditDate,
        },
        {
            classList:['row__td','row__contact-list'],
            getContent: getContactsContent,
        },
        {
            classList:['row__td','row__actions'],
            getContent: getActionsContent,
        },
    ];
    const contactTypeList = [
        {type:'phone', data: {text: 'Телефон', btnClass:'row__contact--phone', mask: '+{7}(000)000-00-00'}},
        {type:'email', data:{text:'Email', btnClass:'row__contact--mail', mask: /^[a-zA-Z0-9@._-]*?$/}},
        {type:'fb', data:{text:'Facebook', btnClass:'row__contact--fb', mask: ''}},
        {type:'vk', data:{text:'VK', btnClass:'row__contact--vk', mask: ''}},
        {type:'other', data:{text:'Другое', btnClass:'row__contact--other', mask: ''}},
    ];    

    async function callAPI(options){
        let response = {};
        const defaultResponse = {errors: [{message:'Что-то пошло не так...'}]};
        try {
            response = await fetch(options.url ,{
                method: options.method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: options.body,
            });    
            const ok = response.ok;
            response = await response.json();
            if (!ok && (!response.errors || response.errors.length === 0) || !response){
                response = defaultResponse;
            }
            return response;
        }
        catch (apiError){
            return defaultResponse;
        }
    }

    async function getClientList(searchText = ''){
        return await callAPI({
            url: `${serverURL}?search=${searchText}`,
            method: 'GET'
        });
    }

    async function getClient(clientID){
        return await callAPI({
            url: `${serverURL}/${clientID}`,
            method: 'GET'
        });
    }

    async function deleteClient(clientID) {
        return await callAPI({
            url: `${serverURL}/${clientID}`,
            method: 'DELETE',
        });
    }

    async function saveClient(client) {
        const method = (client.id)?'PATCH':'POST';
        return await callAPI({
            url: `${serverURL}/${client.id}`,
            method: method,
            body: JSON.stringify(client),
        });
    }

    function getIdHtml(client){
        const idElement = document.createElement('a');
        idElement.classList.add('row__id-link');
        idElement.id = client.id;
        idElement.href = `${document.location.origin}/#${client.id}`;
        idElement.textContent = client.id;
        return[idElement];
    }

    function getFioHtml(client){
        return [client.surname + ' ' + client.name + ' ' + client.lastName||''];
    }

    function getClientCreateDate(client){
        return getDate(client.createdAt);
    }

    function getClientEditDate(client){
        return getDate(client.updatedAt);
    }

    function getDate(dateString){
        const myDate = new Date(dateString);
        const result = [];
        result.push(myDate.toLocaleString('ru',{year:"numeric",month:'2-digit',day:'2-digit'}) + ' ');
        const timeElement = document.createElement('span');
        timeElement.classList.add('row__time');
        timeElement.textContent = myDate.toLocaleString('ru',{hour:'2-digit',minute:'2-digit'});
        result.push(timeElement);
        return result;
    }

    function getContactsContent(client){
        
        const result = [];
        const contactsInRow = 5;

        for (let contact of client.contacts){
            const contactButton = document.createElement('button');
            const contactType = contactTypeList.find(element => element.type===contact.type);
            contactButton.classList.add('button','row__contact',contactType.data.btnClass);
            if (contactType.data.mask){
                const masked = IMask.createMask({
                    mask: contactType.data.mask,
                  });
                contact.value = masked.resolve(contact.value);
            }
            contactButton.dataset.tippyContent = `${contactType.data.text}: ${contact.value}`;
            contactButton.textContent = '1';
            if (result.length === contactsInRow - 1 && client.contacts.length > contactsInRow){
                const groupButton = document.createElement('button');
                groupButton.classList.add('row__contact','row__contact--group','button','contact-group');
                groupButton.dataset.tippyContent = `Еще ${client.contacts.length - contactsInRow + 1}`;
                const groupSpan = document.createElement('span');
                groupSpan.classList.add('contact-group__count');
                groupSpan.textContent = client.contacts.length - 4 ;  //<span class="contact-group__count">6</span>
                groupButton.append('+',groupSpan);
                groupButton.addEventListener('click', event => {
                    groupButton.classList.add('display-none');
                });
                result.push(groupButton);
            }
            result.push(contactButton);

        }

        return result;
    }

    function getActionsContent(client){
        const editButton = document.createElement('button');
        editButton.classList.add('row__actions-btn','row__edit-btn','button');
        editButton.textContent = 'Изменить';
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('row__actions-btn','row__delete-btn','button');
        deleteButton.textContent = 'Удалить';
        return [editButton,deleteButton];
    }

    function getWaitElement(classNames){
        const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
        svg.setAttribute('viewBox','0 0 100 100');

        const path = document.createElementNS('http://www.w3.org/2000/svg','path');
        path.setAttribute('d','M14.0002 50.0005C14.0002 69.8825 30.1182 86.0005 50.0002 86.0005C69.8822 86.0005 86.0002 69.8825 86.0002 50.0005C86.0002 30.1185 69.8823 14.0005 50.0003 14.0005C45.3513 14.0005 40.9082 14.8815 36.8282 16.4865');
        path.setAttribute('stroke-width','8');
        path.setAttribute('stroke-miterlimit','10');
        path.setAttribute('stroke-linecap','round');
        svg.appendChild(path);
        svg.setAttribute('fill','none');
        svg.setAttribute('class',classNames);

        return svg;
    }

    async function reloadTable(searchText = ''){

        searchText = searchText;

        function insertEmptyRow(content){
            const row = tbody.insertRow();
            row.classList.add('table__row','row', 'row--empty');
            const emptyCell = document.createElement('td');
            emptyCell.classList.add('row__td');
            emptyCell.colSpan = 6;
            emptyCell.append(content);
            row.append(emptyCell);
        }

        const tbody = document.querySelector('.table > .table__tbody');

        let clientList = [];
        let emptyText = 'Клиентов не найдено...';

        tbody.style.position = 'relative';
        const waitOverlay = document.createElement('div');
        waitOverlay.classList.add('wait-overlay');
        waitOverlay.appendChild(getWaitElement('wait-icon wait-icon--firm table__wait-icon'));
        
        tbody.innerHTML = '';

        insertEmptyRow(waitOverlay);
        const addButton = document.querySelector('.main__add-btn');
        addButton.setAttribute('disabled','');
        const apiResponse = await getClientList(searchText);
        addButton.removeAttribute('disabled');
        if (apiResponse.errors){
            emptyText = apiResponse.errors[0].message;
        }
        else {
            clientList = apiResponse;
        }

        tbody.innerHTML = '';

        if (clientList.length === 0){
            insertEmptyRow(emptyText);
        }

        for (let client of clientList){
            const row = tbody.insertRow();
            row.classList.add('table__row','row');
            row.id = client.id;

            const cellsArray = [];

            for (let cell of cellsDescr){
                const cellElement = document.createElement('td');
                cellElement.classList.add(...cell.classList);

                if (cell.getContent){
                    if (typeof cell.getContent === 'string'){
                        cellElement.append(client[cell.getContent]);
                    }
                    else if (typeof cell.getContent === 'function'){
                        const cellContent = cell.getContent(client);
                        for (let element of cellContent){
                            cellElement.append(element);
                        }
                        
                    }
                }
                cellsArray.push(cellElement );
            }

            row.append(...cellsArray);

        }

        selectColumn(document.querySelector('.thead__button'));

        tippy('table [data-tippy-content]');

        document.querySelectorAll('.row__edit-btn').forEach(element => {
            element.addEventListener('click',async event => {
                const waitElement = getWaitElement('wait-icon wait-icon--firm row__wait-icon');
                element.classList.add('row__edit-btn--waiting');
                element.prepend(waitElement);
                await showEditForm(element.closest('tr').id);
                waitElement.remove();
                element.classList.remove('row__edit-btn--waiting');
            });
        });

        document.querySelectorAll('.row__delete-btn').forEach(element => {
            element.addEventListener('click', event => {
                event.preventDefault();
                const clientID = element.closest('tr').id;
                showDeleteForm(clientID);    
            });
        });

        document.querySelectorAll('.row__id-link').forEach(element => {
            element.addEventListener('click', event => {
                event.preventDefault();
            })
        });
    }

    function showErrorList(errList){
        document.querySelector('.modal:not(.display-none) .edit-form__err').classList.add('display-none');
        document.querySelectorAll('.modal:not(.display-none) .modal__input--wrong').forEach(element => {
            element.classList.remove('modal__input--wrong');
        });

        const errElement = document.querySelector('.modal:not(.display-none) .modal__err');
        if (errList){
            errElement.classList.remove('display-none');
            errElement.textContent = 'Ошибка: ';

            for (let err of errList){
                errElement.append(err.message, document.createElement('br'));
                if (err.field){
                    document.querySelector(`.modal:not(.display-none) [name=${err.field}]`).classList.add('modal__input--wrong');
                }
                else if (err.element){
                    err.element.classList.add('modal__input--wrong');
                }
            }
        }

    }

    function checkClient(){
        const errMessages = {
            surname: "Фамилия обязательна для заполнения",
            name: "Имя обязательно для заполнения",
            contactText: "Контакт не может быть пустым",
        }
        const errList = [];
        document.querySelectorAll('.modal:not(display-none) input:invalid').forEach(element => {
            errList.push({message: errMessages[element.name], element: element});
        });

        if (errList.length > 0){
            showErrorList(errList);
            return false;
        }
        return true;
    }

    async function submitClient() {

        const client = {contacts:[]};

        if (!checkClient()){
            return;
        }

        document.querySelectorAll('.edit-form input:not(.edit-form__contact)').forEach( element => {
            client[element.name] = element.value;
            element.setAttribute('disabled','');
        });

        document.querySelectorAll('.edit-form__contact-container').forEach(element => {
            const contactTextElement = element.querySelector(':scope > input[name=contactText]');
            let contactText = contactTextElement.value;
            if (!contactText){
                return;
            }
            const contactTypeElement = element.querySelector(':scope select[name=contactType]');
            const contactType = contactTypeList.find(element => element.type === contactTypeElement.value);
            if (contactType.data.mask){
                const masked = IMask.createMask({
                    mask: contactType.data.mask,
                })
                masked.resolve(contactText);
                contactText = masked.unmaskedValue;
            }
            if (contactTypeList)
            client.contacts.push({type:contactTypeElement.value,value:contactText});
            contactTextElement.setAttribute('disabled','');
            contactTypeElement.setAttribute('disabled','');
        });

        const submitButton = document.querySelector('.edit-form .modal__primary-btn');
        const waitElement = getWaitElement('wait-icon wait-icon--firm modal__wait-icon');
        submitButton.prepend(waitElement);
        
        const apiResponse = await saveClient(client);

        waitElement.remove();

        if (apiResponse.errors){
            showErrorList(apiResponse.errors);
        }
        else {
            document.querySelector('.edit-form__err').classList.add('display-none');
            document.querySelectorAll('.modal__input--wrong').forEach(element => {
                element.classList.remove('modal__input--wrong');
            });
            closeModalWindow();
            await reloadTable();
        }

    }

    async function submitDeleteForm(clientID){
        const errElement = document.querySelector('.delete-form__err');
        if (clientID){
            const submitButton = document.querySelector('.delete-form .modal__primary-btn');
            const waitElement = getWaitElement('wait-icon wait-icon--firm modal__wait-icon');
            submitButton.prepend(waitElement);

            const apiResponse = await deleteClient(clientID);

            waitElement.remove();

            if (apiResponse.errors){
                showErrorList(apiResponse.errors);
            }
            else {
                closeModalWindow();
                await reloadTable();    
            }
        }
        else {
            errElement.classList.remove('display-none');
            errElement.textContent = "Ошибка: ID клиента не определен!";
        }
    }

    function showDeleteForm(clientID){
        document.querySelectorAll('.modal:not(.delete-form)').forEach(element => {
            element.classList.add('display-none');
        });
        document.querySelector('.delete-form').classList.remove('display-none');
        document.querySelector('.modal-overlay').classList.remove('display-none');
        document.querySelector('.delete-form input[name=id]').value = clientID;
    }

    function addScrollbars(element){
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        if ( element.offsetHeight >= window.innerHeight){
            simpleBar = OverlayScrollbars(element, {}); 
        }
        else {
            if (simpleBar){
                simpleBar.destroy();
            }
        }
    }

    async function showEditForm(clientID){

        const modalForm = document.querySelector('.edit-form');
        const formTitle = document.querySelector('.edit-form__title');
        const idInput = document.querySelector('.edit-form__form > [name=id]');
        const nameInput = document.querySelector('.edit-form__name');
        const surnameInput = document.querySelector('.edit-form__surname');
        const lastNameInput = document.querySelector('.edit-form__lastname');
        const cancelButton = document.querySelector('.edit-form__cancel-btn');
        const deleteButton = document.querySelector('.edit-form__delete-btn');

        const contactListElement = document.querySelector('.edit-form__contact-list');
        document.querySelectorAll('.edit-form__contact-list > .edit-form__contact-container').forEach(elem => {
            contactListElement.removeChild(elem);
        });

        if (clientID){
            formTitle.textContent = 'Изменить данные ';

            const apiResponse = await getClient(clientID);

            if (apiResponse.errors){
                showErrorList(apiResponse);
            }
            else {
                const client = apiResponse;
                const idElement = document.createElement('span');
                idElement.classList.add('edit-form__id');
                idElement.textContent = 'ID:' + clientID;
                
                idInput.value = clientID;
                nameInput.value = client.name;
                surnameInput.value = client.surname;
                lastNameInput.value = client.lastName;
                formTitle.append(idElement);

                for (let contact of client.contacts){
                    addContactInput(contact);
                }
            }

            cancelButton.classList.add('display-none');
            deleteButton.classList.remove('display-none');
            document.location.hash = clientID;

        }
        else {
            formTitle.innerHTML = 'Новый клиент';

            idInput.value = "";
            nameInput.value = "";
            surnameInput.value = "";
            lastNameInput.value = "";
            cancelButton.classList.remove('display-none');
            deleteButton.classList.add('display-none');
        }

        document.querySelector('.modal-overlay').classList.remove('display-none');
        modalForm.classList.remove('display-none');
        addScrollbars(modalForm);
        tippy('.edit-form [data-tippy-content]');
        document.querySelector('.edit-form__close-btn').focus();
    }

    function closeModalWindow(){
        document.querySelectorAll('.modal__err').forEach(element => {
            element.textContent = "";
            element.classList.add('display-none');
        });
        document.querySelectorAll('.modal__input--wrong').forEach(element => {
            element.classList.remove('modal__input--wrong');
        });
        document.querySelectorAll('.modal').forEach(element => {
            element.classList.add('display-none');
        });

        document.querySelector('.modal-overlay').classList.add('display-none');

        history.pushState("", document.title, window.location.pathname + window.location.search);

        if (simpleBar){
            simpleBar.destroy();
        };

        document.querySelectorAll('[disabled]').forEach(element => {
            element.removeAttribute('disabled');
        });

        document.querySelector('.header__search-container').classList.remove('header__search-container--mobile');        

    }

    function addContactMask(contactType,inputElement,maskObject = null){
        let mask = contactTypeList.find(element => element.type===contactType).data.mask;
        if (mask){
            if (maskObject){
                maskObject.updateOptions({mask: mask, lazy: false});
            }
            else {
                maskObject = IMask(inputElement, {mask: mask, lazy: false});
            }
        }
        else {
            if (maskObject){
                maskObject.updateOptions({lazy:true});
                maskObject.destroy();
                maskObject = null;
            }
        }
        return maskObject;
    }

    function addContactInput(contact = null){
        const contactListElement = document.querySelector('.edit-form__contact-list');
        const contactContainerElement = document.createElement('div');
        contactContainerElement.classList.add('edit-form__contact-container');
        const contactTypeElement = document.createElement('select');
        contactTypeElement.classList.add('edit-form__contact-type');
        contactTypeElement.name = 'contactType';
        const editForm = document.querySelector('.edit-form');

        const contactTypeOptions = [];
        for (let contactType of contactTypeList){
            const myOption = document.createElement('option');
            myOption.value = contactType.type;
            myOption.textContent = contactType.data.text;
            if (contact && myOption.value === contact.type){
                myOption.setAttribute('selected','');
            }
            contactTypeOptions.push(myOption);
        }
        contactTypeElement.append(...contactTypeOptions);

        const contactInputElement = document.createElement('input');
        contactInputElement.type = 'text';
        contactInputElement.classList.add('edit-form__contact');
        contactInputElement.placeholder = 'Введите данные контакта';
        contactInputElement.name = 'contactText';
        contactInputElement.setAttribute('required','');
        if (contact){
            contactInputElement.value = contact.value;
        }

        let maskObject = addContactMask(contactTypeElement.value,contactInputElement);
        if (maskObject){
            contactInputElement.value = maskObject.value;
        } 
        contactTypeElement.addEventListener('change', event => {
            maskObject = addContactMask(contactTypeElement.value,contactInputElement,maskObject);
        });

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.classList.add('button','edit-form__del-contact-btn');
        deleteButton.addEventListener('click', event =>{
            contactListElement.removeChild(contactContainerElement);
            addScrollbars(editForm);
        });
        deleteButton.dataset.tippyContent = 'Удалить контакт';

        const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
        svg.setAttribute('width','16');
        svg.setAttribute('height','16');
        svg.setAttribute('viewBox','0 0 16 16');

        const path = document.createElementNS('http://www.w3.org/2000/svg','path');
        path.setAttribute('d','M8 2C4.682 2 2 4.682 2 8C2 11.318 4.682 14 8 14C11.318 14 14 11.318 14 8C14 4.682 11.318 2 8 2ZM8 12.8C5.354 12.8 3.2 10.646 3.2 8C3.2 5.354 5.354 3.2 8 3.2C10.646 3.2 12.8 5.354 12.8 8C12.8 10.646 10.646 12.8 8 12.8ZM10.154 5L8 7.154L5.846 5L5 5.846L7.154 8L5 10.154L5.846 11L8 8.846L10.154 11L11 10.154L8.846 8L11 5.846L10.154 5Z');

        svg.appendChild(path);
        deleteButton.appendChild(svg);

        contactContainerElement.append(contactTypeElement,contactInputElement,deleteButton);

        contactListElement.insertBefore(contactContainerElement,document.querySelector('.edit-form__add-contact-btn'));

        const myChoice = new Choices(contactTypeElement,{
            addItems: true,
            searchEnabled: false,
            itemSelectText: '',
            shouldSort: false,
            classNames: {
                containerOuter: 'choices edit-form__choices',
            },
        });  

        addScrollbars(editForm);
    }

    function selectColumn(button){
        document.querySelectorAll('.thead__button--selected').forEach(element => element.classList.remove('thead__button--selected'));
        button.classList.add('thead__button--selected');
    }

    function sortTable(button){

        const columnIndex = button.closest('th').cellIndex;

        const tbody = document.querySelector('tbody');

        const rowsArray = Array.from(tbody.rows);

        const sortType = button.dataset.type;

        button.dataset.desc = (!button.classList.contains('thead__button--selected') || button.dataset.desc)?"":"desc";        

        const invertSort = Math.pow(-1,!!button.dataset.desc) ;

        let compare;
  
        switch (sortType) {
            case 'number':
                compare = function(rowA, rowB) {
                return (rowA.cells[columnIndex].textContent - rowB.cells[columnIndex].textContent)*invertSort;
                };
                break;
            case 'text':
                compare = function(rowA, rowB) {
                return (rowA.cells[columnIndex].textContent > rowB.cells[columnIndex].textContent ? 1 : -1)*invertSort;
                };
                break;
            case 'date':
                compare = function(rowA, rowB) {
                    const regex = /(\d\d).(\d\d).(\d\d\d\d)(\d\d):(\d\d)/g;
                    const dateA = new Date(rowA.cells[columnIndex].textContent.replace(regex,'$3-$2-$1 $4:$5'));
                    const dateB = new Date(rowB.cells[columnIndex].textContent.replace(regex,'$3-$2-$1 $4:$5'));
                    return (dateA - dateB)*invertSort;
                };
                break;
        }
  
        rowsArray.sort(compare);
  
        tbody.append(...rowsArray);

        selectColumn(button);

        document.querySelectorAll('.thead__button[data-desc=desc]:not(.thead__button--selected)').forEach(
            element => element.dataset.desc = ''
        );
    }

    function noScroll(event) {
        window.scrollTo(0, 0);
    }

    function avoidScroll(){
        return true;
    }

    function allowScroll(){
        return true;
    }

    
    async function doSearch(event){
        const searchInput = event.target;
        const searchText = event.target.value;
        const searchResults = document.querySelector('.header__search-results');
        const searchContainer = document.querySelector('.header__search-container');
        const searchRegExp = new RegExp(`(${searchText})`,'ig');

        function closeSearch(){
            window.removeEventListener('scroll', noScroll);
            searchResults.classList.add('display-none');        
        }
        function markSearchResults(text){
            return text.replaceAll(searchRegExp,`<span class="color-firm">$1</span>`);
        }
    
        if (searchText.length === 0){
            closeSearch();
            return;
        }

        searchResults.innerHTML = '';
        const waitElement = getWaitElement('wait-icon wait-icon--firm header__wait-icon');
        searchContainer.appendChild(waitElement);

        const clients = await getClientList(searchText);

        waitElement.remove();
        searchResults.classList.remove('display-none');
        window.removeEventListener('scroll', noScroll);
        window.addEventListener('scroll', noScroll);
        document.body.addEventListener('click', event => {
            if (!event.target.closest('.header__search-container')){
                closeSearch();
            }
        })

        for(let client of clients){
            const clientButton = document.createElement('button');
            clientButton.classList.add('button','search-results__button');
            let clientInnerHtml = '';
            clientInnerHtml = markSearchResults(`${client.surname} ${client.name} ${client.lastName}`);
            for (let contact of client.contacts){
                if (contact.value.search(searchRegExp) >= 0){
                    const contactType = contactTypeList.find(element => element.type === contact.type);
                    if (contactType){
                        clientInnerHtml += `<span class="color-gray">...${contactType.data.text}:${markSearchResults(contact.value)}</span>`;
                    }
                }
            }

            clientButton.innerHTML = clientInnerHtml;
            clientButton.addEventListener('click', event => {
                event.preventDefault();
                closeSearch();
                location.hash = client.id;
            });
            clientButton.addEventListener('keyup', event => {
                event.preventDefault();
                if (event.code === 'ArrowUp'){
                    const previousSibling = event.target.previousSibling;
                    if (previousSibling){
                        previousSibling.focus();
                    }
                    else {
                        searchInput.focus();
                    }
                }
                else if (event.code === 'ArrowDown') {
                    const nextSibling = event.target.nextSibling;
                    if (nextSibling){
                        nextSibling.focus();
                    }
                }
            });
            clientButton.addEventListener('focus', event => {
                window.removeEventListener('scroll', noScroll);
                window.addEventListener('scroll', noScroll);        
            })
            searchResults.appendChild(clientButton);
        }

    };

    async function onHashChange(event){
        const clientID = location.hash.replace('#','');
        const element = document.getElementById(clientID);
        const scroll = new SmoothScroll({
            speed: 500,
            easing: 'easeInOutCubic',
            updateURL: false,
            popstate: false,             
        });
        scroll.animateScroll(element);        
        await showEditForm(clientID);
    }

    function initApp(){

        document.querySelector('.main__add-btn').addEventListener('click',event => {
            event.preventDefault();
            showEditForm();
        });

        document.querySelectorAll('.modal__close-btn, .modal__cancel-btn, .modal-overlay').forEach(element => {
            element.addEventListener('click', event => {
                event.preventDefault();
                closeModalWindow();
            })
        });

        document.querySelector('.edit-form__form').addEventListener('submit', async event =>{
            event.preventDefault();
            await submitClient();
        });

        document.querySelector('.edit-form__delete-btn').addEventListener('click', event => {
            event.preventDefault();
            const clientID = document.querySelector('.edit-form input[name=id]').value;
            showDeleteForm(clientID);
        });

        document.querySelector('.delete-form__form').addEventListener('submit', async event => {
            event.preventDefault();
            const clientID = document.querySelector('.delete-form input[name=id]').value;
            await submitDeleteForm(clientID);
        });

        document.querySelector('.edit-form__add-contact-btn').addEventListener('click', event => {
            addContactInput();
        });

        document.querySelector('.header__form input[name=search]').addEventListener('input', event => {
            clearTimeout(searchTimeout);
            // searchTimeout = setTimeout(async ()=> await reloadTable(event.target.value) ,searchWaitTime);
            searchTimeout = setTimeout(async ()=> await doSearch(event) ,searchWaitTime);
        });

        document.querySelector('.header__form input[name=search]').addEventListener('focus', async event => {
            if (event.target.value){
                await doSearch(event);
            }
        });

        document.querySelector('.header__form input[name=search]').addEventListener('keyup', event => {
            event.preventDefault();
            if (event.code === 'ArrowDown' && event.target.value){
                const nextResultElement = document.querySelector('.header__search + .search-results > .search-results__button');
                if (nextResultElement){
                    nextResultElement.focus();
                }    
            }
        });

        document.querySelectorAll('.thead__button').forEach(element => {
            element.addEventListener('click', event => sortTable(element));
        });

        window.addEventListener('hashchange', async event => {
            await onHashChange(event);
        });

        document.querySelector('.logo').addEventListener('click', event => {
            document.querySelector('.header__search-container').classList.toggle('header__search-container--mobile');
        });

    }

    async function createApp(){
        const pageParams = new URLSearchParams(window.location.search);
        const search = pageParams.get('search')||'';
        document.querySelector('.header__form input[name=search]').value = search;
        initApp();
        await reloadTable(search);
        if (location.hash){
            await onHashChange();
        }
    }

    document.addEventListener('DOMContentLoaded', createApp);
})();