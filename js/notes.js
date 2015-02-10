
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
		autore: usr.name,
		mail: usr.email
	};
	notes.push(n);
	//abilitare pulsanti per modificare e salvare le annotazioni
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
	n = {
		type: tipo,
		value: val[0],
		valueLeg: val[1],
		primoSpan: -1,
		num: nAnnDoc,
		data: currtime(),
		tripla: tripla,
	};
	notes.push(n);
	//insertAnnDoc(tipo, [n.valueLeg, usr.name, usr.email, n.data], n.num); inserisce l'annotazione tra i metadati
	nAnnDoc++;
	// attivare pulsanti per modifica e salvataggio annotazioni
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
						//$('#vuoto').remove();
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







