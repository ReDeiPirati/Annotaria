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
	
	$('#manage-nav-button').parent().removeClass('disabled');
	
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


//funzione che inserisce un'annotazione su documento tra quelle non salvate e la rende visibile chiamando insertAnnDoc. I parametri sono gli stessi di addNote
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
	
	$('#manage-nav-button').parent().removeClass('disabled');
}

/* funzione che inserisce gli span di un'annotazione su frammento e chiama ChangeColor per renderla visibile o meno in base ai filtri.
- il parametro "nodi" e' un vettore con tutti i nodi di testo dell'annotazione
- "offStart" e "offEnd" sono gli offset relativi rispettivamente al primo e all'ultimo nodo
- "tipo" e' il tipo dell'annotazione
- "temp" e' un valore booleano che e' true se l'annotazione e' ancora non salvata, false altrimenti
- "index" l'indice dell'annotazione nel vettore corrispondente, identificato tramite "temp"
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


//funzione che restituisce il riferimento al vettore delle annotazioni non salvate se il parametro passato e' una striga uguale a "true", altrimenti al vettore delle annotazioni salvate su triple store
function getRightNotes(temp) {
	if (temp === "true" || temp === true )
		return notes;
	else
		return notesRem;
}

/* funzione che restituisce l'indice dell'annotazione che ha la data piu' recente dalla lista "ann" a partire dall'indice "from"
"ann" e' un vettore di oggetti composti dai campi temp e ind, che indicano rispettivamente se l'annotazione e' non salvata e l'indice di tale annotazione nel suo vettore
*/
function getMax(ann, from) {
	var max, data = '0';
	for (var i=from; i<ann.length; i++) {
		vet = getRightNotes(ann[i].temp);
		if (vet[ann[i].ind].data > data) {
			max = i
			data = vet[ann[i].ind].data;
		}
	}
	return max;
}

//funzione che ordina per data le annotazoni in una lista con le caratteristiche descritte nella funzione getMax
function ordinaPerData(ann) {
	for (var i=0; i<ann.length; i++) {
		vet = getRightNotes(ann[i].temp);
		var j=getMax(ann, i);
		var tmp=ann[i];
		ann[i]=ann[j];
		ann[j]=tmp;
	}
}



function prepareAnnotationInfo(obj, i) {
	if( $(obj).is('span[id|="span-ann"]') ) {
		if(!$(obj).is('.noneColor')) {
			$('#annShowSelect').append('<option value="' + i + '">Annotazione ' + i + '</option>');
			var info = document.createElement("div");
			$(info).addClass('hide');
			$(info).addClass('annotationInfo');
			var index = $(obj).attr("data-ann");
			var ann;
		
			if( $(obj).attr("data-temp") === true || $(obj).attr("data-temp") === "true" )
				ann = notes[index];
			else
				ann = notesRem[index];
		
			$(info).append('<div><strong>Autore:</strong> ' + ann.autore + '<div>');
			$(info).append('<div><strong>Email:</strong></strong> ' + ann.mail + '<div>');
			$(info).append('<div><strong>Data:</strong></strong></strong> ' + ann.data.replace('T', ', ') + '<div>');
			$(info).append('<div><strong>Tipo:</strong> ' + ann.type + '<div>');
			$(info).append('<div><strong>Annotazione:</strong> ' + ann.valueLeg + '<div>');
			$('.alert.alert-info').append(info);
			prepareAnnotationInfo($(obj).parent(), i + 1);
		}
		else
			prepareAnnotationInfo($(obj).parent(), i);
	}	
}

function switchAnnotationInfo() {
	$('.annotationInfo:not(".hide")').addClass('hide');
	$($('.annotationInfo')[$(this).val() -1 ]).removeClass('hide');
}

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


/* funzione che inserisce visivamente un'annotazione su documento dell'utente o dal triple store aggiungendo il div corrispondente nel riquadro delle proprieta' del documento.
- il parametro "tipo" e' il tipo dell'annotazione
- "ann" e' un vettore dove ann[0] e' il corpo dell'annotazione, ann[1] il nome dell'autore, ann[2] la sua mail e ann[3] la data dell'annotazione
- "id" e' l'identificativo delle annotazioni dell'utente, dato dal numero progressivo nAnnDoc. Se questo parametro non e' passato allora l'annotazione viene dal triple store
*/
function insertAnnDoc(tipo, ann, id) {
	if ($('#documentAnnotation .tab-pane.active .list-group a#docAnn' + tipo).length == 0) {
		$('#documentAnnotation .tab-pane.active .list-group').append('<a href="#" class="list-group-item disabled" id="docAnn' + tipo + '">' + tipo + '<span class="badge">0</span></a>');
	}
	
	var eventualeId = ""; //id per annotazioni temporanee
	if (id != undefined)
		eventualeId = 'a-doc-' + id;
	$('#documentAnnotation .tab-pane.active .list-group a#docAnn' + tipo).after('<a href="#" class="list-group-item" id="' + eventualeId + '"><div class="aut">Autore: '+ann[1]+'</div><div class="mail">Mail: '+ann[2]+'</div><div class="data">Data: '+ ann[3].replace('T', ', ') + '</div><div class="cont">Annotazione: '+ann[0]+'</div></a>');
	$('#documentAnnotation .tab-pane.active .list-group a#docAnn' + tipo + ' span.badge').html( parseInt( $('#documentAnnotation .tab-pane.active .list-group a#docAnn' + tipo + ' span.badge').text()) + 1);
}

function newListIstance (val, valueLeg) {
	$("#InstanceSelect").prepend("<option value='" + val + "'>" + valueLeg + "</option>");
	$('#InstanceSelect').find('option:selected').prop('selected',false);
	$($('#InstanceSelect option')[0]).prop('selected',true);
}

/* funzione che inserisce 2 o 3 statement nel triple store relativi allo stesso soggetto
- "sog", "pre" e "ogg" sono soggetto, predicato e oggetto del primo statement
- "pre2" e "ogg2" predicato e oggetto del secondo
- "ogg3" viene usato solo per le annotazioni di tipo citazione, per cui il predicato e' noto a priori
*/
function insClasse(sog, pre, ogg,pre2,ogg2,ogg3, succFunz) {
	return $.ajax({
		data: {endpoint: endpointURL.slice(0,-6), sog:sog, pre:pre, ogg:ogg, pre2:pre2, ogg2:ogg2, ogg3:ogg3},
		url: '/cgi-bin/insertTriple.php', 
		method: 'POST',
		success: succFunz(sog, ogg2)
	});
}

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


function insertLocalAnnotation (citType, fragment, idData, tripla, addinfo) {
	var funz = null;
	
	if (fragment)
		funz = addNote;
	else
		funz = salvaTempAnn;
	
	if ($('#'+idData).val() != '') {
		if ($("input[type='radio'][name='InstanceRadio']:checked").val() == 'add') {
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

//funzione che dato il numero progressivo del primo span di un'annotazione ne rimuove tutti gli span
function cancSpanAnn(n) {
	var span,  next = n;
	do {
		span = $('#span-ann-'+next);
		next = span.attr('data-next');
		span.contents().unwrap();
	} while (next!='none');
}
/*
function findAnn( ann) {
	for( var i=0; i< notes.length; i++)
		if( notes[i] == ann )
			return i;
}
*/
function deleteLocalAnnotation ( ann, tag ) {
	$('#' + tag).remove();
	
	$('#manage-local-annotation div.modal-body .list-group a[name="manageDoc' + ann.doc + '"] span.badge').html( parseInt( $('#manage-local-annotation div.modal-body .list-group a[name="manageDoc' + ann.doc + '"] span.badge').text()) - 1);
	
	if( tag != "")
		notes.splice( notes.indexOf(ann), 1);
	
	if (ann.primoSpan > -1)
		cancSpanAnn(ann.primoSpan); //questa chiamata da loop
	else {
		$('#a-doc-'+ann.num).remove();
		$('#documentAnnotation .tab-pane.active .list-group a#docAnn' + ann.type + ' span.badge').html( parseInt( $('#documentAnnotation .tab-pane.active .list-group a#docAnn' + ann.type + ' span.badge').text()) - 1);
	}
	
	if (notes.length == 0)
		$('#manage-nav-button').parent().addClass('disabled');
}

function updateAnn (ann, tag, newval, newvalLeg, frag) {
	$('#annote').modal('hide');
	ann.value = newval;
	ann.valueLeg = newvalLeg;
	ann.data = currtime();
	$($('#' + tag + ' div.row div')[1]).text(newvalLeg);

	//riaggiungo l'annotazione sul documento e aggiorno le altre
	if(frag)
		$('span-ann-' + ann.primoSpan).attr('data-data', ann.data);
	else {
		$('#a-doc-' + ann.num + ' div.cont').text('Annotazione: ' + ann.valueLeg);
		$('#a-doc-' + ann.num + ' div.data').text('Data: ' + ann.data);
	}
}

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
			$('#DbpediaSelect').append($('<option>').prop("selected", true).value(ann.value).text(ann.valueLeg));
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

//funzione che data un'annotazione la inserisce nel triple store
function inserAnn(n) {
	var sub = dpref['ao'] + ann.doc;
	var tar= dpref['ao'] + ann.doc + '.html';
	if (n.type == 'hasAuthor')
		sub = dpref['ao'] + ann.doc.substr(0, ann.doc.length-5);
	if (n.primoSpan > -1)
		sub += '#' + n.id + '-' + n.offStart + '-' + n.offEnd;
	dati = { 
		endpoint: endpointURL.slice(0,-6),
		labelann: tipoLeggibile[n.type], 
		target:tar,  
		anntype: n.type,
		uriann: 'mailto:' + usr.email, 
		oraann: n.data /*+'^^'+dpref['xs']+'date'*/, 
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

//funzione che fa partire la richiesta di inserimento nel triple store dell'annotazione passata e ne registra l'esito
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


/* funzione che cambia l'attributo data-ann di tutti gli span di un'annotazione, che indica l'indice di tale annotazione nel vettore relativo.
- il parametro "n" e' il numero progressivo del primo span
- "ind" il nuovo indice dell'annotazione nel proprio vettore
- "cambiaTemp" e' un booleano che indica se impostare a false l'attributo data-temp, che indica se l'annotazione e' tra quelle non salvate o no
*/
function cambiaIndSpanAnn(n, ind, cambiaTemp) {
	var span,  next = n;
	do {
		span = $('#span-ann-'+next);
		span.attr('data-ann',ind);
		if (cambiaTemp)
			span.attr('data-temp','false');
		next = span.attr('data-next');
	} while (next!='none');
}

//funzione che tenta di salvare tutte le annotazioni temporanee nel triple store e da messaggi di successo o errore in base all'esito
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
				$('#manage-nav-button').parent().addClass('disabled');
				notes = [];
			}
			else {
				alert(fallite.length + " annotazioni non sono state salvate.");
				notes = fallite;
			}
		});
	}
}

function confirmLocalAnnotation(){
	$.when( insertTripleStore() ).then(function (data) { 
		if (data.success == "true") { 
			$('#manage-local-annotation').modal('hide');
		}
		else {
			alert("Errore nell'inserimento: "+data.message[data.message.length-1]);
		}
	},
	function () {
		alert("Errore nello script di inserimento");
	});	
}

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

function listLocalNotes() {
	$('#manage-local-annotation div.modal-body .list-group a').remove();
	for (var i =0; i < notes.length; i++) {
		var value = notes[i].value.split('/');
		value  = value[value.length -1];
		
		if ($('#manage-local-annotation div.modal-body .list-group a[name="manageDoc' + notes[i].doc + '"]').length == 0) {
			$('#manage-local-annotation div.modal-body .list-group').append('<a href="#" class="list-group-item disabled" name="manageDoc' + notes[i].doc + '">' + notes[i].doc + '<span class="badge">0</span></a>');
		}
		var aId = "a-ann-" +i;
		$('#manage-local-annotation div.modal-body .list-group a[name="manageDoc' + notes[i].doc + '"]').after('<a href="#" class="list-group-item" id="' + aId + '"><div class="row"><div class="col-xs-12 col-sm-3 col-md-3">' + notes[i].type + '</div><div class="col-xs-12 col-sm-7 col-md-7 ">' + value + '</div></div></a>');

		
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
