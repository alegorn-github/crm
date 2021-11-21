'use strict';

(()=>{

    const serverURL = `https://crm-backend-alegorn.herokuapp.com/api/clients`;
    let searchTimeout = null;
    let simpleBar = null;
    const searchWaitTime = 300;

    const tableDescr = [
        {
            header: {caption:'ID',type:'number',selected:true},
            classList: ['row__td','row__id'],
            getContent: getIdHtml,
        },
        {
            header: {caption:'Фамилия Имя Отчество',type:'text',classList:['thead__client']},
            classList: ['row__td','row__client'],
            getContent: getFioHtml,
        },
        {
            header: {caption:'Дата и время создания',type:'date'},
            classList: ['row__td','row__create'],
            getContent: getClientCreateDate,
        },
        {
            header: {caption:'Последние изменения',type:'date'},
            classList:['row__td','row__edit'],
            getContent: getClientEditDate,
        },
        {
            header: {caption:'Контакты',classList:['thead__contacts']},
            classList:['row__td','row__contact-list'],
            getContent: getContactsContent,
        },
        {
            header: {caption:'Действия'},
            classList:['row__td','row__actions'],
            getContent: getActionsContent,
        },
    ];

    function tippy (elements){
        function getCoords(elem) {
            var box = elem.getBoundingClientRect();
        
            var body = document.body;
            var documentElement = document.documentElement;
        
            var scrollTop = window.pageYOffset || documentElement.scrollTop || body.scrollTop;
            var scrollLeft = window.pageXOffset || documentElement.scrollLeft || body.scrollLeft;
        
            var clientTop = documentElement.clientTop || body.clientTop || 0;
            var clientLeft = documentElement.clientLeft || body.clientLeft || 0;
        
            var top  = box.top +  scrollTop - clientTop;
            var left = box.left + scrollLeft - clientLeft;
        
            return { top: Math.round(top), left: Math.round(left) };
        }
        const edgeMargin = 3;        
        const tippyTarget = (typeof elements === 'string')?document.querySelectorAll(elements):(elements.constructor === NodeList)?elements:[elements];
        const ballonElement = document.createElement('div');
        ballonElement.classList.add('tippy-ballon');
        const ballonArrow = document.createElement('div');
        ballonArrow.classList.add('tippy-arrow');
        tippyTarget.forEach(target => {
            target.addEventListener('mouseover', event => {
                ballonElement.textContent = target.dataset.tippyContent;
                ballonElement.style.visibility = 'hidden';
                ballonArrow.style.visibility = 'hidden';
                target.appendChild(ballonElement);
                target.appendChild(ballonArrow);            
                target.classList.add('tippy--on');
                const edgeElement = target.closest('.tippy-edge, body');
                let translateX = 0;
                if (getCoords(ballonElement).left + ballonElement.offsetWidth > getCoords(edgeElement).left + edgeElement.offsetWidth){
                    translateX = getCoords(ballonElement).left + ballonElement.offsetWidth - getCoords(edgeElement).left - edgeElement.offsetWidth;
                    translateX += edgeElement.offsetWidth - edgeElement.clientWidth + edgeMargin;
                    translateX = -translateX;
                }
                else if (getCoords(ballonElement).left < getCoords(edgeElement).left){
                    translateX = getCoords(ballonElement).left - getCoords(edgeElement).left - edgeMargin;
                }
                if (translateX){
                    ballonElement.style.transform = `translate(-50%) translateX(${translateX}px)`;
                }

                ballonElement.style.visibility = 'visible';
                ballonArrow.style.visibility = 'visible';

            });
            target.addEventListener('mouseleave', event => {
                target.classList.remove('tippy--on');
            });
        });
        return true;
    }
    
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
        function getContactClass(type){
            switch (type){
                case 'phone':
                case 'Телефон':
                    return 'row__contact--phone';
                case 'email':
                case 'Email':
                    return 'row__contact--mail';
                case 'fb':
                case 'Facebook':
                    return 'row__contact--fb';
                case 'vk':
                case 'VK':
                    return 'row__contact--vk';
                default:
                    return 'row__contact--other';
            }
        }
    
            
        const result = [];
        const contactsInRow = 5;

        for (let contact of client.contacts){
            const contactButton = document.createElement('button');
            contactButton.classList.add('button','row__contact',getContactClass(contact.type));
            contactButton.dataset.tippyContent = `${contact.type}: ${contact.value}`;
            contactButton.textContent = '1';
            if (result.length === contactsInRow - 1 && client.contacts.length > contactsInRow){
                const groupButton = document.createElement('button');
                groupButton.classList.add('row__contact','row__contact--group','button','contact-group');
                groupButton.dataset.tippyContent = `Еще ${client.contacts.length - contactsInRow + 1}`;
                const groupSpan = document.createElement('span');
                groupSpan.classList.add('contact-group__count');
                groupSpan.textContent = client.contacts.length - 4 ;
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
        const icon = document.createElement('div');
        icon.classList.add('wait-icon');
        icon.classList.add(...classNames.split(' '));

        return icon;
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

            for (let cell of tableDescr){
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
            element.classList.add('overflow-y-scroll');
        }
        else {
            element.classList.remove('overflow-y-scroll');
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

    function addContactInput(contact = null){
        const contactListElement = document.querySelector('.edit-form__contact-list');
        const contactContainerElement = document.createElement('div');
        contactContainerElement.classList.add('edit-form__contact-container');
        const contactTypeElement = document.createElement('select');
        contactTypeElement.classList.add('edit-form__contact-type');
        contactTypeElement.name = 'contactType';
        const editForm = document.querySelector('.edit-form');
        const contactTypeList = [
            'Телефон',
            'Email',
            'Facebook',
            'VK',
            'Другое',
        ];

        if (!contactTypeList.find(element => element === contact?.type) && contact){
            contactTypeList.push(contact.type);
        }
    
        const contactTypeOptions = [];
        for (let contactType of contactTypeList){
            const myOption = document.createElement('option');
            myOption.value = contactType;
            myOption.textContent = contactType;
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

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.classList.add('button','edit-form__del-contact-btn');
        deleteButton.addEventListener('click', event =>{
            contactListElement.removeChild(contactContainerElement);
            addScrollbars(editForm);
        });
        deleteButton.dataset.tippyContent = 'Удалить контакт';
        tippy(deleteButton);

        const deleteIcon = document.createElement('div');
        deleteIcon.classList.add('edit-form__del-contact-icon');

        deleteButton.appendChild(deleteIcon);

        contactContainerElement.append(contactTypeElement,contactInputElement,deleteButton);

        contactListElement.insertBefore(contactContainerElement,document.querySelector('.edit-form__add-contact-btn'));

        const myChoice = new Choices(contactTypeElement,{
            addItems: true,
            searchEnabled: false,
            itemSelectText: '',
            shouldSort: false,
            placeholder: false,
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

        document.querySelectorAll('.row__contact--group.display-none').forEach(element => {
            element.classList.remove('display-none');
        })

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
                    const regex = /(\d\d).(\d\d).(\d\d\d\d)\s(\d\d):(\d\d)/g;
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
                    clientInnerHtml += `<span class="color-gray">...${contact.type}:${markSearchResults(contact.value)}</span>`;
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
        element.scrollIntoView({behavior: 'smooth', block: 'center'});
        await showEditForm(clientID);
    }

    function getHeader(){
        const header = document.createElement('header');
        header.classList.add('header');

        const headerContainer = document.createElement('div');
        headerContainer.classList.add('container','header__container');

        const searchForm = document.createElement('form');
        searchForm.classList.add('header__form');
        searchForm.action = '.';
        searchForm.method = "GET";

        const logoButton = document.createElement('button');
        logoButton.classList.add('header__logo', 'logo', 'button');
        logoButton.type = 'button';

        const searchContainer = document.createElement('div');
        searchContainer.classList.add('header__search-container');

        logoButton.addEventListener('click', event => {
            searchContainer.classList.toggle('header__search-container--mobile');
        });

        const searchInput = document.createElement('input');
        searchInput.classList.add('header__search');
        searchInput.type = 'text';
        searchInput.placeholder = 'Введите запрос';
        searchInput.name = 'search';
        searchInput.addEventListener('input', event => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async ()=> await doSearch(event) ,searchWaitTime);
        });
        searchInput.addEventListener('focus', async event => {
            if (event.target.value){
                await doSearch(event);
            }
        });
        searchInput.addEventListener('keyup', event => {
            event.preventDefault();
            if (event.code === 'ArrowDown' && event.target.value){
                const nextResultElement = document.querySelector('.header__search + .search-results > .search-results__button');
                if (nextResultElement){
                    nextResultElement.focus();
                }    
            }
        });



        const searchResults = document.createElement('div');
        searchResults.classList.add('header__search-results','search-results','display-none');

        searchContainer.append(searchInput,searchResults);

        searchForm.append(logoButton,searchContainer);

        headerContainer.appendChild(searchForm);

        header.appendChild(headerContainer);

        return header;
        
    }

    function getMain(){

        const mainElement = document.createElement('main');
        mainElement.classList.add('main');

        const mainContainer = document.createElement('div');
        mainContainer.classList.add('container','main__container');

        const tableElement = document.createElement('table');
        tableElement.classList.add('main__table','table');

        const captionElement = document.createElement('caption');
        captionElement.classList.add('table__caption');

        const tableHeading = document.createElement('h1');
        tableHeading.classList.add('table__heading');
        tableHeading.textContent = 'Клиенты';

        captionElement.append(tableHeading);

        const theadElement = document.createElement('thead');
        theadElement.classList.add('table__thead','thead');

        const theadRow = document.createElement('tr');
        theadRow.classList.add('thead__tr');

        function getColumnHeader(data){

            const thElement = document.createElement('th');
            thElement.classList.add('thead__th');

            for (let myClass of data.classList||[]){
                thElement.classList.add(myClass);
            }

            if (data.type){
                const thButton = document.createElement('button');
                thButton.classList.add('thead__button','button');
                if (data.selected){
                    thButton.classList.add('thead__button--selected');
                }
                thButton.dataset.type = data.type;
    
                const captionArray = data.caption.split(/\s(?=\S*?$)/);
    
                const lastWord = captionArray.pop();
    
                for (let caption of captionArray){
                    thButton.append(caption + ' ');
                }
    
                const noWrapSpan = document.createElement('span');
                noWrapSpan.classList.add('white-space--no-wrap');
    
                const sortSpan = document.createElement('span');
                sortSpan.classList.add('thead__sort');
    
                noWrapSpan.append(lastWord,sortSpan);

                thButton.append(noWrapSpan);
                thButton.addEventListener('click', event => sortTable(thButton));

                thElement.append(thButton);
    
            }
            else {
                thElement.textContent = data.caption;
            }

            return thElement;
        }

        for (let cell of tableDescr){
            theadRow.append(getColumnHeader(cell.header));
        }

        theadElement.append(theadRow);

        const tbodyElement = document.createElement('tbody');
        tbodyElement.classList.add('table__tbody');

        tableElement.append(captionElement,theadElement,tbodyElement);

        mainContainer.append(tableElement);

        mainElement.append(mainContainer);

        return mainElement;
    }

    function getFooter(){
        const footerElement = document.createElement('footer');
        footerElement.classList.add('footer');

        const footerContainer = document.createElement('div');
        footerContainer.classList.add('container','footer__container');

        const addButton = document.createElement('button');
        addButton.classList.add('main__add-btn','button','secondary');
        addButton.type = 'button';
        addButton.addEventListener('click',event => {
            event.preventDefault();
            showEditForm();
        });

        const addIcon = document.createElement('span');
        addIcon.classList.add('main__add-icon');

        addButton.append(addIcon,'Добавить клиента');

        footerContainer.appendChild(addButton);

        footerElement.appendChild(footerContainer);

        return footerElement;
    }

    function getModalOverlay(){
        const modalOverlay = document.createElement('div');
        modalOverlay.classList.add('modal-overlay','display-none');
        modalOverlay.addEventListener('click', event => {
            event.preventDefault();
            closeModalWindow();
        });


        return modalOverlay;
    }

    function getModal(formElement, options){
        const modalFormElement = document.createElement('div');
        modalFormElement.classList.add('modal','display-none');

        for (let myClass of options?.classList||[]){
            modalFormElement.classList.add(myClass);
        }

        const modalForm = formElement;
        modalForm.classList.add('modal__form');

        const closeButton = document.createElement('button');
        closeButton.classList.add('modal__close-btn','button');
        closeButton.addEventListener('click', event => {
            event.preventDefault();
            closeModalWindow();
        });

        if (options.elementName){
            modalFormElement.classList.add(options.elementName);
            modalForm.classList.add(`${options.elementName}__form`);
            closeButton.classList.add(`${options.elementName}__close-btn`);
        }

        modalForm.append(closeButton);

        modalFormElement.appendChild(modalForm);

        return modalFormElement ;
    }

    function getFloatPlaceHolderElement(data){
        const floatPHElement = document.createElement('div');
        floatPHElement.classList.add('float-placeholder');

        const inputElement = document.createElement('input');
        inputElement.classList.add('float-placeholder__input');
        for (let myClass of data.classList){
            inputElement.classList.add(myClass);
        }
        inputElement.name = data.name;
        inputElement.id = data.id||data.name;
        inputElement.type = 'text';
        inputElement.placeholder = data.placeholder;
        inputElement.value = data.value;
        if (data.required){
            inputElement.setAttribute('required','');
        }

        const labelElement = document.createElement('label');
        labelElement.setAttribute('for',data.id||data.name);
        labelElement.classList.add('float-placeholder__label');
        
        const starElement = document.createElement('span');
        starElement.classList.add('float-placeholder__star');
        starElement.textContent = '*';

        labelElement.append(data.placeholder,starElement);

        floatPHElement.append(inputElement,labelElement);

        return floatPHElement;
    }
    
    function getEditForm(){
        const editFormElement = document.createElement('form');
        editFormElement.setAttribute('novalidate','');

        const idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.name = 'id';
        idInput.value = '';

        editFormElement.appendChild(idInput);

        const editFormDataContainer = document.createElement('div');
        editFormDataContainer.classList.add('edit-form__container','edit-form__data');

        const titleElement = document.createElement('h2');
        titleElement.classList.add('edit-form__title');
        titleElement.textContent = 'Новый клиент';

        const surnameElement = getFloatPlaceHolderElement({classList:['edit-form__surname','edit-form__input'],name:'surname',placeholder:'Фамилия',required:true});
        const nameElement = getFloatPlaceHolderElement({classList:['edit-form__name','edit-form__input'],name:'name',placeholder:'Имя',required:true});
        const lastNameElement = getFloatPlaceHolderElement({classList:['edit-form__lastname','edit-form__input'],name:'lastName',placeholder:'Отчество'});

        editFormDataContainer.append(titleElement,surnameElement,nameElement,lastNameElement);

        editFormElement.append(editFormDataContainer);

        const contactListContainer = document.createElement('div');
        contactListContainer.classList.add('edit-form__container','edit-form__container--gray','edit-form__contact-list');

        const addContactButton = document.createElement('button');
        addContactButton.type = 'button';
        addContactButton.classList.add('edit-form__add-contact-btn','button');

        addContactButton.append('Добавить контакт');
        addContactButton.addEventListener('click', event => {
            addContactInput();
        });


        contactListContainer.append(addContactButton);

        editFormElement.append(contactListContainer);

        const controlsContainer = document.createElement('div');
        controlsContainer.classList.add('edit-form__container','edit-form__controls');

        const errPlaceholder = document.createElement('span');
        errPlaceholder.classList.add('edit-form__err','modal__err','display-none');

        const saveButton = document.createElement('button');
        saveButton.classList.add('edit-form__submit-btn','modal__primary-btn','button');
        saveButton.textContent = 'Сохранить';

        const cancelButton = document.createElement('button');
        cancelButton.classList.add('edit-form__cancel-btn','modal__cancel-btn','modal__secondary-btn','button');
        cancelButton.type = 'button';
        cancelButton.textContent = 'Отменить';
        cancelButton.addEventListener('click', event => {
            event.preventDefault();
            closeModalWindow();
        });

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('edit-form__delete-btn','modal__secondary-btn','button','display-none');
        deleteButton.type = 'button';
        deleteButton.textContent = 'Удалить';
        deleteButton.addEventListener('click', event => {
            event.preventDefault();
            const clientID = document.querySelector('.edit-form input[name=id]').value;
            showDeleteForm(idInput.value);
        });

        controlsContainer.append(errPlaceholder,saveButton,cancelButton,deleteButton);

        editFormElement.append(controlsContainer);
        editFormElement.addEventListener('submit', async event =>{
            event.preventDefault();
            await submitClient();
        });

        return getModal(editFormElement,{elementName:'edit-form',classList:['tippy-edge']});
    }

    function getDeleteForm(){
        const deleteForm = document.createElement('form');
        deleteForm.classList.add('delete-form');

        const titleElement = document.createElement('h2');
        titleElement.classList.add('delete-form__title');
        titleElement.textContent = 'Удалить клиента';

        const textElement = document.createElement('span');
        textElement.classList.add('delete-form__text');
        textElement.textContent = 'Вы действительно хотите удалить данного клиента?';

        const idElement = document.createElement('input');
        idElement.type = 'hidden';
        idElement.name = 'id';
        idElement.value = '';

        const errTextElement = document.createElement('span');
        errTextElement.classList.add('delete-form__err','edit-form__err','modal__err','display-none');

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-form__submit-btn','modal__primary-btn','button');
        deleteButton.textContent = 'Удалить';

        const cancelButton = document.createElement('button');
        cancelButton.classList.add('modal__cancel-btn','modal__secondary-btn','button');
        cancelButton.type = 'button';
        cancelButton.textContent = 'Отменить';
        cancelButton.addEventListener('click', event => {
            event.preventDefault();
            closeModalWindow();
        });

        deleteForm.append(titleElement,textElement,idElement,errTextElement,deleteButton,cancelButton);
        deleteForm.addEventListener('submit', async event => {
            event.preventDefault();
            const clientID = document.querySelector('.delete-form input[name=id]').value;
            await submitDeleteForm(clientID);
        });



        return getModal(deleteForm,{elementName:'delete-form'});
    }       

    async function createApp(){

        const appContainer = document.querySelector('#app');

        appContainer.append(getHeader(), getMain(), getFooter(), getModalOverlay(),getEditForm(),getDeleteForm());

        const pageParams = new URLSearchParams(window.location.search);
        const search = pageParams.get('search')||'';
        document.querySelector('.header__form input[name=search]').value = search;

        await reloadTable(search);

        if (location.hash){
            await onHashChange();
        }

        window.addEventListener('hashchange', async event => {
            await onHashChange(event);
        });

    }

    document.addEventListener('DOMContentLoaded', createApp);
})();