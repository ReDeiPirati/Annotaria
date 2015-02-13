
//funzione che data una stringa rappresentante una data in formato consono al semantic web la rende leggibile a tutti gli utenti
function dataLeggibile(data) {
	return data.replace('T', ', ');
}


//funzione che restituisce il nodo non di testo che sia il primo antenato comune agli estremi del range passato come parametro
function getRangeContainerElement(range) {
    var container = range.commonAncestorContainer;
    if (container.nodeType == 3) { //nodo di testo
        container = container.parentNode;
    }
    return container;
}

//funzione che restituisce una stringa con la data attuale nel formato corretto per le annotazioni
function currtime(){
	var data = new Date();
	var dato = new Array(data.getFullYear() ,data.getMonth()+1 ,data.getDate() , data.getHours() ,data.getMinutes());
	for(i=0;i<=4;i++)
	{
		dato[i] = dammizero(dato[i]);			
	}
	return componiData(dato);
}

//funzione che restituisce un vettore con tutti i nodi di testo in ordine da sinistra a destra contenuti (del tutto o in parte) nel range passato come parametro
function getRangeTextNodes(range) {
	var anc = getRangeContainerElement(range), alltext = [], st, end;
	anc.descendantTextNodes(alltext);
	st = alltext.indexOf(range.startContainer);
	alltext.splice(0, st);
	end = alltext.indexOf(range.endContainer)+1;
	alltext.splice(end, alltext.length - end);
	return alltext;
}



/* funzione che aggiunge un'annotazione su frammento tra quelle non salvate e chiama insertNote per inserirla visivamente nel documento
- il parametro "type" rappresenta il tipo di annotazione da creare
- "val" e' un vettore di due elementi in cui il primo e' il corpo dell'annotazione in formato consono al semantic web (ad es. un URI) mentre il secondo e' un valore leggibile all'utente
- "tripla" e' un vettore di 3 elementi con le informazioni necessarie per salvare l'annotazione sul triple store con le proprieta' giuste
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
	
	insertNote(nTestoSelezionati, selezioneUtente.startOffset, selezioneUtente.endOffset, type, true, notes.length-1);
}

/* funzione che date informazioni su un'annotazione su frammento presa dal triple store prepara i dati necessari a insertNote per renderla visibile
- il parametro "ancestor" e' una stringa con l'id dell'antenato comune ai nodi di inizio e fine dell'annotazione
- "start" e "end" sono gli offset dell'annotazione in base ad "ancestor"
- "tipo" e' il tipo dell'annotazione
- "ind" e' la posizione di questa annotazione nel vettore notesRem, da inserire come attributo degli span
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


//funzione che in base ai filtri scelti dall'utente nasconde o mostra le annotazioni
function ChangeColor()
{       var i,j=1;
 var tutti , colore = 256225;
 var vector = new Array();
 var color= new Array();
 var element = document.getElementsByClassName("colori");
 $("[pittura]").removeAttr("pittura");

 for(i = 0; i< element.length ; i++)
 {
	 if(element[i].checked)
	 {
		 vector.push(element[i].value);
	 }
 }
 for(i = 0; i < vector.length ; i++)
 {
	 var vet = $("."+vector[i]);
	 for (var k=0; k<vet.length; k++) {
		 var dataok = true, data;
		 if ($('#filDat').prop('checked')) {
			 data = $('.dato-anno')[2].value + '-' + dammizero(parseInt($('.dato-anno')[1].value)) +'-'+dammizero(parseInt($('.dato-anno')[0].value));
			 if ($(vet[k]).attr('data-data').indexOf(data) != 0)
				 dataok=false;
		 }
		 if ((!$('#filAut').prop('checked') || $(vet[k]).attr('data-autore').indexOf($('.dato-autore').val()) != -1) && dataok)
			 $(vet[k]).attr("pittura",vector[i]);
	 }
 }
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
		span.setAttribute('onclick', 'preparaAnnotazioni(this)');
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
	ChangeColor();
}


//funzione che restituisce il riferimento al vettore delle annotazioni non salvate se il parametro passato e' una striga uguale a "true", altrimenti al vettore delle annotazioni salvate su triple store
function getRightNotes(temp) {
	if (temp === "true" || temp === true )
		return notes;
	else
		return notesRem;
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


//funzione che passata un'annotazione compone una stringa con le sue informazioni in html. Il parametro "last" e' un booleano che indica se e' l'ultima annotazione, usato per mettere o no il separatore delle annotazioni
function annToHtml(ann, last) {
	str = '<div>';
	str += '<p>Autore: '+ann.autore+'</p>';
	str += '<p>E-mail: '+ann.mail+'</p>';
	str += '<p>Data: '+dataLeggibile(ann.data)+'</p>';
	str += '<p>'+tipoLeggibile[ann.type]+': '+ann.valueLeg+'</p>';
	if (!last)
		str += '<hr>';
	str += '</div>';
	return str;
}




//funzione chiamata quando si clicca su un'annotazione su frammento, prende come parametro il nodo cliccato, prepara la lista di tutte le annotazioni sul testo cliccato e infine la rende visibile. Le variabili primo e ultimo servono per evitare che in caso di annotazioni sovrapposte tutte quante preparino l'elenco con le annotazioni. Soltanto l'annotazione dello span piu' in profondita' prepara effettivamente le annotazioni

function preparaAnnotazioni(tag) {
	if ($(tag).attr('pittura')) {
		dove = '#mostraAnn';			/*Non c'è il modale su cui mostrare le annotazioni nel nostro progetto quindi non si vede , in più bisogna creare
							il modale dinamicamente per ogni finestra di documento aperto*/
		if (primo) {
			$(dove+' div').remove();
			var anc, ann;
			primo=false;
			ultimo=tag.id;
			anc = tag;
			ann = [];
			while (anc.id != 'file') {
				if (anc.id.indexOf('span-ann')==0 && $(anc).attr('pittura')) {
					ann.push({ind: $(anc).attr('data-ann'), temp: $(anc).attr('data-temp')});
					ultimo=anc.id;
				}
				anc=anc.parentNode;
			}
			ordinaPerData(ann);
			var vet;
			for (var i=0; i<ann.length; i++) {
				vet = getRightNotes(ann[i].temp);
				$(dove).append(annToHtml(vet[ann[i].ind], i==ann.length-1));
			}
			$(dove).show();
		}
		if (ultimo==tag.id) {
			primo=true;
			ultimo=undefined;
		}
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
	$('#documentAnnotation .tab-pane.active .list-group a#docAnn' + tipo).after('<a href="#" class="list-group-item" id="' + eventualeId + '"><div class="aut">Autore: '+ann[1]+'</div><div class="mail">Mail: '+ann[2]+'</div><div class="data">Data: '+dataLeggibile(ann[3])+'</div><div class="cont">Annotazione: '+ann[0]+'</div></a>');
	$('#documentAnnotation .tab-pane.active .list-group a#docAnn' + tipo + ' span.badge').html( parseInt( $('#documentAnnotation .tab-pane.active .list-group a#docAnn' + tipo + ' span.badge').text()) + 1);
}

/* funzione che inserisce 2 o 3 statement nel triple store relativi allo stesso soggetto
- "sog", "pre" e "ogg" sono soggetto, predicato e oggetto del primo statement
- "pre2" e "ogg2" predicato e oggetto del secondo
- "ogg3" viene usato solo per le annotazioni di tipo citazione, per cui il predicato e' noto a priori
*/
function insClasse(sog, pre, ogg,pre2,ogg2,ogg3) {
	return $.ajax({
		data: {endpoint: endpointURL.slice(0,-6), sog:sog, pre:pre, ogg:ogg, pre2:pre2, ogg2:ogg2, ogg3:ogg3},
		url: '/cgi-bin/insertTriple.php', 
		method: 'POST',
		//success: function (d) { for (x in d.message) {alert(d.message[x]); } }
	});
}

function addInstanceSelectOption (citType, addinfo ) {
	
	var nome = $("#InstanceText").val().trim();
	if(nome != "") {
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
			if (confirm("L'aggiunta non potr\u00E1 essere annullata. Procedere?")) {
				var tipo = addinfo[1];
				var label = addinfo[2];
				var ogg3 = '';
				if (citaz) 
					ogg3 = dpref['fabio']+'Item';

				$.when( insClasse(newel, dpref['rdf']+'type', tipo, label, nome, ogg3 ) ).then(function (data) { 
					if (data.success == "true") { 
						$("#InstanceSelect").prepend("<option value='"+newel+"'>"+nome+"</option>");
						$('#InstanceSelect option:selected').prop('selected',false);
						$($('#InstanceSelect option')[0]).prop('selected',true);
					}
					else {
						alert("Errore nell'inserimento: "+data.message[data.message.length-1]);
					}
				},
				 function () {
					 alert("Errore nello script di inserimento");
				}); 
			}
		}
		else {
			alert("l'uri inserito contiene errori");
		}
		return true;
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
				alert("ricontrolla il form");	
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

function findAnn( ann) {
	for( var i=0; i< notes.length; i++)
		if( notes[i] == ann )
			return i;
}

function deleteLocalAnnotation ( ann ) {
	$(this).parent().parent().parent().remove();
	
	$('#manage-local-annotation div.modal-body .list-group a[name="manageDoc' + ann.doc + '"] span.badge').html( parseInt( $('#manage-local-annotation div.modal-body .list-group a[name="manageDoc' + ann.doc + '"] span.badge').text()) - 1);
	
	notes.splice( findAnn(ann), 1);
	
	if (ann.primoSpan > -1)
		cancSpanAnn(ann.primoSpan); //questa chiamata da loop
	else {
		$('#a-doc-'+ann.num).remove();
		$('#documentAnnotation .tab-pane.active .list-group a#docAnn' + ann.type + ' span.badge').html( parseInt( $('#documentAnnotation .tab-pane.active .list-group a#docAnn' + ann.type + ' span.badge').text()) - 1);
	}
	
	if (notes.length == 0)
		$('#manage-nav-button').parent().addClass('disabled');
}

function updateLocalAnnotation (ann){
	//$('#manage-local-annotation').modal('hide');
	deleteLocalAnnotation(ann);
	resetAnnoteModalWindow();
	$('#annote-nav-button').trigger('click');
	// imposto current selection con i valori della vecchia selezione
	$('#documentAnnotationForm').addClass('hide');
	
	selectWid(ann.type);
	
	//$('manage-nav-button').trigger('click');
	
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
		dati.start = n.offStart /*+'^^'+dpref['xs']+'nonNegativeInteger'*/;
		dati.end = n.offEnd /*+'^^'+dpref['xs']+'nonNegativeInteger'*/;
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

function listLocalNotes() {
	$('#manage-local-annotation div.modal-body .list-group a').remove();
	for (var i =0; i < notes.length; i++) {
		var value = notes[i].value.split('/');
		value  = value[value.length -1];
		
		if ($('#manage-local-annotation div.modal-body .list-group a[name="manageDoc' + notes[i].doc + '"]').length == 0) {
			$('#manage-local-annotation div.modal-body .list-group').append('<a href="#" class="list-group-item disabled" name="manageDoc' + notes[i].doc + '">' + notes[i].doc + '<span class="badge">0</span></a>');
		}

		$('#manage-local-annotation div.modal-body .list-group a[name="manageDoc' + notes[i].doc + '"]').after('<a href="#" class="list-group-item"><div class="row"><div class="col-xs-12 col-sm-3 col-md-3">' + notes[i].type + '</div><div class="col-xs-12 col-sm-7 col-md-7 ">' + value + '</div><div class="col-xs-12 col-sm-2 col-md-2"></div></div></a>');

		var buttondiv = document.createElement("div");
		$(buttondiv).addClass('col-xs-12 col-sm-2 col-md-2');
		
		var updatebutton = document.createElement("button");
		$(updatebutton).attr('type','button');
		$(updatebutton).addClass('manage');
		//$(updatebutton).click({param1: notes[i]}, updateLocalAnnotation);
		updatebutton.innerHTML = '<span class="glyphicon glyphicon-cog">&nbsp;<span>';
		
		var deletebutton = document.createElement("button");
		$(deletebutton).attr('type','button');
		$(deletebutton).addClass('manage');
		$(deletebutton).click({param1: notes[i]}, deleteLocalAnnotation);
		deletebutton.innerHTML = '<span class="glyphicon glyphicon-trash">&nbsp;<span>';
		
		buttondiv.appendChild(updatebutton);
		buttondiv.appendChild(deletebutton);
		
		$($('#manage-local-annotation div.modal-body .list-group a[name="manageDoc' + notes[i].doc + '"]').next().children()[0]).append(buttondiv);
		
		$('#manage-local-annotation div.modal-body .list-group a[name="manageDoc' + notes[i].doc + '"] span.badge').html( parseInt( $('#manage-local-annotation div.modal-body .list-group a[name="manageDoc' + notes[i].doc + '"] span.badge').text()) + 1);
	}
}