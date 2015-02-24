/*
* getRangeContainerElement
*
* restituisce il primo nodo non di testo, che e; antenato comune degli estremi della selezione passata in range
*/
function getRangeContainerElement(range) {
    var container = range.commonAncestorContainer;
    if (container.nodeType == 3) { //nodo di testo
        container = container.parentNode;
    }
    return container;
}

/*
* getRangeContainerElement
*
* restituisce una stringa con la data attuale
*/
function currtime(){
	var data = new Date();
	var dato = new Array(data.getFullYear() ,data.getMonth()+1 ,data.getDate() , data.getHours() ,data.getMinutes());
	for(i=0;i<=4;i++)
	{
		dato[i] = dammizero(dato[i]);			
	}
	return componiData(dato);
}

/*
* getRangeTextNodes
*
* restituisce un vettore con tutti i nodi di testo contenuti (anche parzialmente) nel range
*/
function getRangeTextNodes(range) {
	var anc = getRangeContainerElement(range);
	var alltext = [];
	var st, end;
	anc.descendantTextNodes(alltext);
	st = alltext.indexOf(range.startContainer);
	alltext.splice(0, st);
	end = alltext.indexOf(range.endContainer)+1;
	alltext.splice(end, alltext.length - end);
	return alltext;
}

/*
* addNote
*
* inserisce un'annotazione sul frammento fra quelle locali, poi la mostra visivamente
* type e' il tipo dell'annotazione
* val e' un vettore di due elementi formato dalla coppia [ valore, valore leggibile]
* tripla e' un vettore di 3 elementi con le informazioni per il salvataggio sul triple store
*/
function addNote(type, val,tripla) {
	var nTestoSelezionati = getRangeTextNodes(currentSelection);	
	var offs = currentSelection.startOffset;
	var offe = currentSelection.endOffset;
	var ancestor = getRangeContainerElement(currentSelection);
	if (ancestor.id.indexOf("span-ann") != -1)
		ancestor = ancestor.nonAnnAncestor();
	var alltext = [];
	ancestor.descendantTextNodes(alltext);
	for (var i=0; i<alltext.indexOf(nTestoSelezionati[0]); i++) {
		offs += $(alltext[i]).text().length
		offe += $(alltext[i]).text().length;
	}
	for (var i=alltext.indexOf(nTestoSelezionati[0]); i<alltext.indexOf(nTestoSelezionati[nTestoSelezionati.length-1]); i++)
		offe += $(alltext[i]).text().length;

	var docName = $('.active.doc-tabs a').text();
	docName = docName.substr(2);
	
	n = {
		type: type,
		value: val[0],
		valueLeg: val[1],
		id: ancestor.id,
		offStart: offs,
		offEnd: offe,
		primoSpan: nSpanAnnotazioni,
		data: currtime(),
		tripla: tripla,
		doc: docName,
		autore: usr.name,
		mail: usr.email
	};
	notes.push(n);
	
	$('#manage-nav-button').prop('disabled',false);
	
	insertNote(nTestoSelezionati, currentSelection.startOffset, currentSelection.endOffset, type, true, notes.length-1);
	restoreFilter("ann");
	controlfilter();
}

/*
* addNoteFromInfo
*
* prepara una nnotazione sul frammento (del triple store) per essere resa visibile
* ancestor e' l'id dell'antenato comune agli estremi
* start e end sono gli offset dell'annotazione in base all'antenato
* tipo e' il tipo di annotazione
* ind e' la posizione dell'annnotaizione all'interno del vettore notesRem
*/
function addNoteFromInfo(ancestor, start, end, tipo, ind) {
	var alltext = [];
	var selez = [];
	var i;
	var cont=0;
	var offs;
	var offe;
	ancestor.descendantTextNodes(alltext);
	for (i=0; i<alltext.length && start>=cont; i++)
		cont += $(alltext[i]).text().length;
	selez.push(alltext[i-1]);
	offs = start - cont + $(alltext[i-1]).text().length;
	for( ; i<alltext.length && cont<end; i++) {
		cont += $(alltext[i]).text().length;
		selez.push(alltext[i]);
	}
	offe = end - cont + $(alltext[i-1]).text().length;
	insertNote(selez, offs, offe, tipo, false, ind);
}

/*
* salvaTempAnn
*
* crea un'aanotazione temporanea sul documento e la rende visibile
* tipo e' il tipo dell'annotazione
* val e' un vettore di due elementi formato dalla coppia [ valore, valore leggibile]
* tripla e' un vettore di 3 elementi con le informazioni per il salvataggio sul triple store
*/
function salvaTempAnn(tipo, val,tripla) {
	var n;
	var docName = $('.active.doc-tabs a').text();
	docName = docName.substr(2);
	
	n = {
		type: tipo,
		value: val[0],
		valueLeg: val[1],
		primoSpan: -1,
		num: nAnnDoc,
		data: currtime(),
		tripla: tripla,
		doc: docName,
	};
	notes.push(n);
	insertAnnDoc(tipo, [n.valueLeg, usr.name, usr.email, n.data], n.num); //inserisce l'annotazione tra i metadati
	nAnnDoc++;
	
	$('#manage-nav-button').prop('disabled',false);
}

/* 
* insertNote
*
* inserice visivamente un'annotazione sul frammento
* nodi e' il vettore dei nodi di testo dell'annotazione
* tipo e' il tipo di annotazione
* temp e' un booleano che indica se l'annotazione e' temporanea
* index e' l'indice nel vettore di note (locali o remote) 
*/
function insertNote(nodi, offStart, offEnd, tipo, temp, index) {
	for (var i=0; i<nodi.length; i++) {
		var r = document.createRange();
		if (i==0 && offStart>0)
			r.setStart(nodi[i],offStart);
		else
			r.setStartBefore(nodi[i]);
		if (i==nodi.length-1 && offEnd<nodi[i].textContent.length)
			r.setEnd(nodi[i],offEnd);
		else
			r.setEndAfter(nodi[i]);
		var span = document.createElement('span');
		span.setAttribute('class',tipo);
		span.setAttribute('id', 'span-ann-'+ nSpanAnnotazioni);
		$(span).click({param1: Event }, showAnnotationInfo);
		span.setAttribute('data-ann',index);
		span.setAttribute('data-temp', temp);
		var vet = getRightNotes(temp);
		span.setAttribute('data-autore', vet[index].autore);
		span.setAttribute('data-data', vet[index].data);
		if (i<nodi.length-1) 
			span.setAttribute('data-next', nSpanAnnotazioni+1);
		else
			span.setAttribute('data-next', 'none');		
		nSpanAnnotazioni++;
		r.surroundContents(span);
	}	
}

/*
* getRightNotes
*
* restituisce il riferimento al vettore di note in base al valore di temp
*/
function getRightNotes(temp) {
	if (temp === "true" || temp === true )
		return notes;
	else
		return notesRem;
}

/*
* prepareAnnotationInfo
*
* inserisce i dati nel widget per visualizzare le info sulle annotazioni cliccate
*/
function prepareAnnotationInfo(obj, i) {
	if( $(obj).is('span[id|="span-ann"]') ) {
		if(!$(obj).is('.noneColor')) {
			$('#annShowSelect').append('<option value="' + i + '">Annotazione ' + i + '</option>');
			var info = document.createElement("div");
			$(info).addClass('hide');
			$(info).addClass('annotationInfo');
			var index = $(obj).attr("data-ann");
			var ann = getRightNotes($(obj).attr("data-temp"))[index];
		
			$(info).append('<div><strong>Autore:</strong> ' + ann.autore + '<div>');
			$(info).append('<div><strong>Email:</strong></strong> ' + ann.mail + '<div>');
			$(info).append('<div><strong>Data:</strong></strong></strong> ' + ann.data.replace('T', ', ') + '<div>');
			$(info).append('<div><strong>Tipo:</strong> ' + tipoLeggibile[ann.type] + '<div>');
			$(info).append('<div><strong>Annotazione:</strong> ' + ann.valueLeg + '<div>');
			$('.alert.alert-info').append(info);
			prepareAnnotationInfo($(obj).parent(), i + 1);
		}
		else
			prepareAnnotationInfo($(obj).parent(), i);
	}	
}

/*
* switchAnnotationInfo
*
* mostra l'annotazione selezionata nella select del widget delle info
*/
function switchAnnotationInfo() {
	$('.annotationInfo:not(".hide")').addClass('hide');
	$($('.annotationInfo')[$(this).val() -1 ]).removeClass('hide');
}

/*
* showAnnotationInfo
*
* invocata al click sull'annotazione stoppa la propagazione del click e mostra il widget per visualizzare le info
*/
function showAnnotationInfo(e) {
	e.stopPropagation();
	$('#annShowSelect option').remove();
	$('.annotationInfo').remove();
	
	prepareAnnotationInfo(this, 1);	
	if( $('#annShowSelect option').length) {
		$($('.annotationInfo')[0]).removeClass('hide');
		$('#Annotation-show').modal('show');
	}
}

/*
* insertAnnDoc
*
* inserisce visivamente un annotazione sul documento della sezione meta-dati
* tipo e' il tipo di annotazione
* ann e' un vettore di 4 elementi [ value, nome annotatore, mail annotatore, data annotazione]
* id e' il numero di nAnnDoc usato per identificare le annotazioni temporanee. se non e' passato l'annotazione proviene dal triple store
*/
function insertAnnDoc(tipo, ann, id) {
	if ($('#documentAnnotation .tab-pane.active .list-group a#docAnn' + tipo).length == 0) {
		$('#documentAnnotation .tab-pane.active .list-group').append('<a href="#" class="list-group-item disabled" id="docAnn' + tipo + '">' + tipoLeggibile[tipo] + '<span class="badge">0</span></a>');
	}
	
	var eventualeId = ""; //id per annotazioni temporanee
	if (id != undefined)
		eventualeId = 'a-doc-' + id;
	$('#documentAnnotation .tab-pane.active .list-group a#docAnn' + tipo).after('<a href="#" class="list-group-item" id="' + eventualeId + '"><div class="aut">Autore: '+ann[1]+'</div><div class="mail">Mail: '+ann[2]+'</div><div class="data">Data: '+ ann[3].replace('T', ', ') + '</div><div class="cont">Annotazione: '+ann[0]+'</div></a>');
	$('#documentAnnotation .tab-pane.active .list-group a#docAnn' + tipo + ' span.badge').html( parseInt( $('#documentAnnotation .tab-pane.active .list-group a#docAnn' + tipo + ' span.badge').text()) + 1);
}

/*
* newListIstance
*
* funzione da passare come succFunz a insClasse per selezionare nella select l'elemento appena inserito
* value e' il valore dell'annotazione
* valueLeg e' il valore in forma leggibile
*/
function newListIstance (val, valueLeg) {
	$("#InstanceSelect").prepend("<option value='" + val + "'>" + valueLeg + "</option>");
	$('#InstanceSelect').find('option:selected').prop('selected',false);
	$($('#InstanceSelect option')[0]).prop('selected',true);
}

/*
* insClasse
*
* inserisce uno o piu' statament relativi allo stesso soggetto nel triple store
* sog e' il soggetto del primo statement
* pre e' il predicato del primo statement
* ogg e' l'oggetto del primo statement
* pre2 e' il predicato del secondo statement
* ogg2 e' l'oggetto del secondo statement
* ogg3 e; l'oggetto del terzo statement
* succFunz e' la funzione invocata in caso di successo 
*/
function insClasse(sog, pre, ogg,pre2,ogg2,ogg3, succFunz) {
	return $.ajax({
		data: {endpoint: endpointURL.slice(0,-6), sog:sog, pre:pre, ogg:ogg, pre2:pre2, ogg2:ogg2, ogg3:ogg3},
		url: '/cgi-bin/insertTriple.php', 
		method: 'POST',
		success: succFunz(sog, ogg2)
	});
}

/*
* addInstanceSelectOption
*
* prende il valore della nuova istanza e prepara tutti i dati per inserirlo nel triple store 
* citType e' il tipo di citazione
* addinfo e' un vettore di 3 elementi contenenti gli uri da aggiungere prima degli oggetti/soggetti degli statement
*/
function addInstanceSelectOption (citType, addinfo ) {
	var nome = $("#InstanceText").val().trim();
	if(nome != "") {
		var err = false;
		var newel = '';
		var giusto = false;
		var citaz = false;
		
		if(citType == 'cites')
			citaz = true;
		if(!citaz){			//case non cit
			newel = addinfo[0]+nome.replace(/ /g,'_').replace(/\./g,'');
			giusto = true;
		}
		else if (nome.substr(0,7) == 'http://' && nome.indexOf(' ') == -1) { //case cit
			newel = nome;
			giusto = true;
		}
		if (giusto) {
			if (confirm("questo passaggio non si potra cancellare. Procedere?")) {
				var tipo = addinfo[1];
				var label = addinfo[2];
				var ogg3 = '';
				if (citaz) 
					ogg3 = dpref['fabio']+'Item';

				$.when( insClasse(newel, dpref['rdf']+'type', tipo, label, nome, ogg3, newListIstance ) ).then(function (data) { 
					if (data.success == "true") { 
						alert("elemento aggiunto");
					}
					else {
						alert("Errore nell'inserimento: "+data.message[data.message.length-1]);
					}
				},
				 function () {
						alert("Errore nello script di inserimento");
						err = true;
				}); 
			}
		}
		else {
			alert("l'uri inserito contiene errori");
			return false;
		}
		return !err;
	}
	else
		return false;
}

/*
* insertLocalAnnotation
*
* funzione chiamata dal pulsante crea del widget annote.
* inserisce la nuova annotazione tra le annotaizoni temporanee e poi la visualizza
* citType e' il tipo di citazione
* fragment indica se l'annotazione e' sul documento o sul frammento
* idData e' l'id dell-elemento da cui ottenere il valore della selezione
* tripla e' un vettore di 3 elementi contenenti uri utilizzati dal server per l'inserimento dell'annotazione nel triple store
* addinfo e' un vettore di 3 elementi contenenti gli uri da aggiungere prima degli oggetti/soggetti degli statement in addIstanceSelectOption
*/
function insertLocalAnnotation (citType, fragment, idData, tripla, addinfo) {
	var funz = null;
	
	if (fragment)
		funz = addNote;
	else
		funz = salvaTempAnn;
	
	if ($('#'+idData).val() != '') {
		if ( addinfo != undefined && $("input[type='radio'][name='InstanceRadio']:checked").val() == 'add') {
			if (!addInstanceSelectOption (citType, addinfo)) {
				alert("Impossibile creare la nuova istanza");
				return ;
			}
		}			
		var vet;
		if (idData == 'InstanceSelect')
			vet = [$('#'+idData).val(), $('#InstanceSelect option:selected').text()];
		else
			vet = [$('#'+idData).val(), $('#'+idData).val()];
		funz(citType, vet, tripla);
		$('#annote').modal('hide');
	}
	else {
		alert('Non hai compilato bene i dati!!!');
	}
}

/*
* cancSpanAnn
*
* dato il numero identificativo di una span, la cancella e esegue lo stesso su tutte le sue discendenti
*/
function cancSpanAnn(n) {
	var span,  next = n;
	do {
		span = $('#span-ann-'+next);
		next = span.attr('data-next');
		span.contents().unwrap();
	} while (next!='none');
}

/*
* deleteLocalAnnotation
*
* elimina l'annotazione temporanea passata per parametro sia visivamente che dal vettore delle note
* ann e' l'oggetto del vettore di note corrispondente all'annotazione da eliminare
* tag e' l'elemento della finestra manage corrispondente all'annotazione da eliminare
*/
function deleteLocalAnnotation ( ann, tag ) {
	$('#' + tag).remove();
	
	$('#manage-local-annotation div.modal-body .list-group a[name="manageDoc' + ann.doc + '"] span.badge').html( parseInt( $('#manage-local-annotation div.modal-body .list-group a[name="manageDoc' + ann.doc + '"] span.badge').text()) - 1);
	
	if( tag != undefined) {
		var num = notes.indexOf(ann);
		for( var i = num +1; i < notes.length; i++) {
			if(notes[i].primoSpan > -1)
				cambiaNumSpanAnn(notes[i].primoSpan, i - 1);
		}
		notes.splice( num, 1);
	}
	
	if (ann.primoSpan > -1)
		cancSpanAnn(ann.primoSpan); //questa chiamata da loop
	else {
		$('#a-doc-'+ann.num).remove();
		$('#documentAnnotation .tab-pane.active .list-group a#docAnn' + ann.type + ' span.badge').html( parseInt( $('#documentAnnotation .tab-pane.active .list-group a#docAnn' + ann.type + ' span.badge').text()) - 1);
	}
	
	if (notes.length == 0)
		$('#manage-nav-button').prop("disabled",true);
}

/*
* updateAnn
*
* aggiorna l'annotazione temporanea passata per parametro sia visivamente che nel vettore delle note
* ann e' l'oggetto del vettore di note corrispondente all'annotazione da aggiornare
* tag e' l'elemento della finestra manage corrispondente all'annotazione da aggiornare
* newval e' il nuovo value da dare all'annotazione
* newvalLeg e' il nuovo valore leggibile da dare all'annotazione
* frag indica se l'annotazione e' sul documento o sul frammento
*/
function updateAnn (ann, tag, newval, newvalLeg, frag) {
	$('#annote').modal('hide');
	ann.value = newval;
	ann.valueLeg = newvalLeg;
	ann.data = currtime();
	$($('#' + tag + ' div.row div')[1]).text(newvalLeg);

	if(frag)
		cambiaDataSpanAnn(ann.primoSpan, ann.data);
	else {
		$('#a-doc-' + ann.num + ' div.cont').text('Annotazione: ' + ann.valueLeg);
		$('#a-doc-' + ann.num + ' div.data').text('Data: ' + ann.data);
	}
}

/*
* updateLocalAnnotation
*
* visualizza il widget annote con il form relativo al tipo di annotazione da aggionare
* ann e' l'oggetto del vettore di note corrispondente all'annotazione da aggiornare
* tag e' l'elemento della finestra manage corrispondente all'annotazione da aggiornare
*/
function updateLocalAnnotation (ann, tag){
	
	resetAnnoteModalWindow();
	$('#annote-nav-button').trigger('click');
	// imposto current selection con i valori della vecchia selezione
	$('#documentAnnotationForm').addClass('hide');
	selectWid(ann.type, ann.value);
	// carico il value della annotazione
	switch(ann.type) {
		case "hasAuthor":			
			$('#annote button.btn-success').unbind("click").click(function() {updateAnn(ann, tag, $('#InstanceSelect').val(), $('#InstanceSelect option:selected').text(), false);});
			break;

		case "hasPublisher":
			$('#annote button.btn-success').unbind("click").click(function() {updateAnn(ann, tag, $('#InstanceSelect').val(), $('#InstanceSelect option:selected').text(), false);});
			break;

		case "hasPublicationYear":
			$('#valDate').find("option:selected").prop("selected", false);
			$('#valDate option[value="' + ann.value + '"]').prop("selected", true);
			$('#annote button.btn-success').unbind("click").click(function() {updateAnn(ann, tag, $('#valDate').val(), $('#valDate').val(), false);});
			break;

		case "hasTitle":
			$('#valLongText').val( ann.value);
			$('#annote button.btn-success').unbind("click").click(function() {updateAnn(ann, tag, $('#valLongText').val(), $('#valLongText').val(), false);});
			break;

		case "hasAbstract":
			$('#valLongText').val( ann.value);
			$('#annote button.btn-success').unbind("click").click(function() {updateAnn(ann, tag, $('#valLongText').val(), $('#valLongText').val(), false);});
			break;

		case "hasShortTitle":
			$('#valShortText').val( ann.value);
			$('#annote button.btn-success').unbind("click").click(function() {updateAnn(ann, tag, $('#valLongText').val(), $('#valShortText').val(), false);});
			break;

		case "hasComment":
			$('#valLongText').val( ann.value);
			$('#annote button.btn-success').unbind("click").click(function() {updateAnn(ann, tag, $('#valLongText').val(), $('#valLongText').val(), false);});
			break;

		case "denotesPerson":
			$('#annote button.btn-success').unbind("click").click(function() {updateAnn(ann, tag, $('#InstanceSelect').val(), $('#InstanceSelect option:selected').text(), true);});
			break;

		case "denotesPlace":
			$('#annote button.btn-success').unbind("click").click(function() {updateAnn(ann, tag, $('#InstanceSelect').val(), $('#InstanceSelect option:selected').text(), true);});
			break;

		case "denotesDisease":
			$('#annote button.btn-success').unbind("click").click(function() {updateAnn(ann, tag, $('#InstanceSelect').val(), $('#InstanceSelect option:selected').text(), true);});
			break;

		case "hasSubject":
			$('#annote button.btn-success').unbind("click").click(function() {updateAnn(ann, tag, $('#InstanceSelect').val(), $('#InstanceSelect option:selected').text(), true);});
			break;

		case "relatesTo":
			$('#DbpediaSelect').append($('<option>').prop("selected", true).val(ann.value).text(ann.valueLeg));
			$('#annote button.btn-success').unbind("click").click(function() {updateAnn(ann, tag, $('#DbpediaSelect').val(), $('#DbpediaSelect option:selected').text(), true);});
			break;

		case "hasClarityScore":
			$('#valChoice').find("option:selected").prop("selected", false);
			$('#valChoice option[value="' + ann.value + '"]').prop("selected", true);
			$('#annote button.btn-success').unbind("click").click(function() {updateAnn(ann, tag, $('#valChoice').val(), $('#valChoice option:selected').text(), true);});
			break;

		case "hasOriginalityScore":
			$('#valChoice').find("option:selected").prop("selected", false);
			$('#valChoice option[value="' + ann.value + '"]').prop("selected", true);
			$('#annote button.btn-success').unbind("click").click(function() {updateAnn(ann, tag, $('#valChoice').val(), $('#valChoice option:selected').text(), true);});
			break;

		case "hasFormattingScore":
			$('#valChoice').find("option:selected").prop("selected", false);
			$('#valChoice option[value="' + ann.value + '"]').prop("selected", true);
			$('#annote button.btn-success').unbind("click").click(function() {updateAnn(ann, tag, $('#valChoice').val(), $('#valChoice option:selected').text(), true);});
			break;

		case "cites":
			$('#annote button.btn-success').unbind("click").click(function() {updateAnn(ann, tag, $('#InstanceSelect').val(), $('#InstanceSelect option:selected').text(), true);});
			break;
	} 
	
}

/*
* inserAnn
*
* inserisce l'annotazione n nel triple store e restituisce il risultato della chiamata ajax
*/
function inserAnn(n) {
	var sub = dpref['ao'] + n.doc;
	var tar= dpref['ao'] + n.doc + '.html';
	if (n.type == 'hasAuthor')
		sub = dpref['ao'] + n.doc.substr(0, n.doc.length-5);
	if (n.primoSpan > -1)
		sub += '#' + n.id + '-' + n.offStart + '-' + n.offEnd;
	dati = { 
		endpoint: endpointURL.slice(0,-6),
		labelann: tipoLeggibile[n.type], 
		target:tar,  
		anntype: n.type,
		uriann: 'mailto:' + usr.email, 
		oraann: n.data , 
		labelstat: n.valueLeg, 
		subject: sub, 
		predicate: n.tripla[1], 
		object: n.value, 
		nomeann: usr.name, 
		emailann: usr.email  
	};
	if (n.primoSpan > -1) {
		dati.target = 'frammento';
		dati.doc = tar;
		dati.val = n.id;
		dati.start = n.offStart;
		dati.end = n.offEnd;
	}
	return $.ajax({
		data: dati,
		datatype: "json",
		url: '/cgi-bin/insert.php', 
		method: 'POST',
	});
}

/*
* insertSingleNote
*
* esegue singole richieste di inserimento sul triple store e setta il campo successo nelle annotazioni 
* temporanee in basa al risultato della funzione inserAnn
*/
function insertSingleNote(ann) {
	return $.when(inserAnn(ann)).then(function (data, textStatus, jqXHR) {
		if (data.success == "true")
			ann.successo = true;
		else
			ann.successo = false;
	}, function () {
		ann.successo = false;
	});
}

/* 
* cambiaIndSpanAnn
*
* aggiorna l'attributo data-ann di tutti gli span di un'annotazione
* n e' il numero identificativo del primo span
* ind e' il nuovo indice dell'oggetto, corrispondente all'annotazione, nel vettore di note
* cambiaTemp se true si aggiorna il campo data-temp in annotazione non temporanea
*/
function cambiaIndSpanAnn(n, ind, cambiaTemp) {
	var span;
	var next = n;
	do {
		span = $('#span-ann-'+next);
		span.attr('data-ann',ind);
		if (cambiaTemp)
			span.attr('data-temp','false');
		next = span.attr('data-next');
	} while (next!='none');
}

/* 
* cambiaDataSpanAnn
*
* aggiorna l'attributo data-ann di tutti gli span di un'annotazione
* n e' il numero identificativo del primo span
* data e' il nuovo valore della data 
*/
function cambiaDataSpanAnn(n, data) {
	var span;
	var next = n;
	do {
		span = $('#span-ann-'+next);
		span.attr('data-data',data);
		next = span.attr('data-next');
	} while (next!='none');
}
/* 
* cambiaNumSpanAnn
*
* aggiorna l'attributo data-ann di tutti gli span di un'annotazione
* n e' il numero identificativo del primo span
* num e' il nuovo valore della data-ann
*/
function cambiaNumSpanAnn(n, num) {
	var span;
	var next = n;
	do {
		span = $('#span-ann-'+next);
		span.attr('data-ann',num);
		next = span.attr('data-next');
	} while (next!='none');
}

/*
* insertTripleStore
*
* cerca di salvare tutte le annotazioni temporanee nel triple store.
* le annotazioni no caricate rimangono in notes
*/
function insertTripleStore() {
	if (confirm("Vuoi procedere a salvare in modo permanente le annotazioni?")) {
		var aspetta = [];
		var fallite = [];
		
		for (var i=0;i<notes.length;i++) 
			aspetta.push(insertSingleNote(notes[i]));
		$.when.apply($,aspetta).always(function() {
			for (var i=0;i<notes.length;i++) {
				var index;
				if (notes[i].successo) {
					notesRem.push(notes[i]);
					index = notesRem.length-1;
				}
				else {
					fallite.push(notes[i]);
					index = fallite.length-1;
				}
				if (notes[i].primoSpan > -1)
					cambiaIndSpanAnn(notes[i].primoSpan, index, notes[i].successo);
			}
			
			if (fallite.length == 0) {
				alert("Annotazioni caricate!!!");
				$('#manage-nav-button').prop("disabled",true);
				$('#manage-local-annotation').modal('hide');
				notes = [];
			}
			else {
				alert(fallite.length + " annotazioni non sono state salvate.");
				notes = fallite;
				$('#manage-local-annotation').modal('hide');
			}
		});
	}
}

/*
* createDeleteButton
*
* crea il punsalte per eliminare le annotazioni temporanee
* ann e' l'oggetto del vettore di note corrispondente all'annotazione da eliminare
* tag e' l'elemento della finestra manage corrispondente all'annotazione da eliminare
*/
function createDeleteButton(obj, tag){
	var but = document.createElement("button");
	$(but).attr('type','button');
	$(but).addClass('manage');
	
	$(but).click(function() {
							 deleteLocalAnnotation(obj, tag);
	});
	but.innerHTML = '<span class="glyphicon glyphicon-trash">&nbsp;<span>';
	return but;
}

/*
* createUpdateButton
*
* crea il punsalte per aggiornare le annotazioni temporanee
* ann e' l'oggetto del vettore di note corrispondente all'annotazione da aggiornare
* tag e' l'elemento della finestra manage corrispondente all'annotazione da aggiornare
*/
function createUpdateButton( obj, tag) {
	var but = document.createElement("button");
	$(but).attr('type','button');
	$(but).addClass('manage');
	$(but).click( function() {
							 updateLocalAnnotation(obj, tag);
	});
	but.innerHTML = '<span class="glyphicon glyphicon-cog">&nbsp;<span>';
	return but;
}

/*
* listLocalNotes
*
* prepara il widget mangae-local-annotation  per la visualizzazione delle annotazioni
* temporanee da visualizzare
*/
function listLocalNotes() {
	$('#manage-local-annotation div.modal-body .list-group a').remove();
	for (var i =0; i < notes.length; i++) {
				
		if ($('#manage-local-annotation div.modal-body .list-group a[name="manageDoc' + notes[i].doc + '"]').length == 0) {
			$('#manage-local-annotation div.modal-body .list-group').append('<a href="#" class="list-group-item disabled" name="manageDoc' + notes[i].doc + '">' + notes[i].doc + '<span class="badge">0</span></a>');
		}
		var aId = "a-ann-" +i;
		$('#manage-local-annotation div.modal-body .list-group a[name="manageDoc' + notes[i].doc + '"]').after('<a href="#" class="list-group-item" id="' + aId + '"><div class="row"><div class="col-xs-12 col-sm-3 col-md-3">' + tipoLeggibile[notes[i].type] + '</div><div class="col-xs-12 col-sm-7 col-md-7 ">' + notes[i].valueLeg + '</div></div></a>');

		
		var buttondiv = document.createElement("div");
		$(buttondiv).addClass('col-xs-12 col-sm-2 col-md-2');
		
		var updatebutton = createUpdateButton( notes[i], aId);		
		var deletebutton = createDeleteButton( notes[i], aId);
		
		buttondiv.appendChild(updatebutton);
		buttondiv.appendChild(deletebutton);
		
		$($('#manage-local-annotation div.modal-body .list-group a[name="manageDoc' + notes[i].doc + '"]').next().children()[0]).append(buttondiv);
		
		$('#manage-local-annotation div.modal-body .list-group a[name="manageDoc' + notes[i].doc + '"] span.badge').html( parseInt( $('#manage-local-annotation div.modal-body .list-group a[name="manageDoc' + notes[i].doc + '"] span.badge').text()) + 1);
	}
}
