notes = []; //vettore delle annotazioni non ancora salvate dell'utente
notesRem = []; //vettore delle annotazioni trovate sul triple store


//funzione che carica tutte le annotazioni su frammento, dato il risultato della query relativa
function caricaAnn(json) {
	var head = json.head.vars;
	var queryResults = json.results.bindings;
	for (var item in queryResults) {
		var id, start, end, tipo, nome, mail, data, val, valLeg, ind;
		if (queryResults[item][head[1]])
			tipo=queryResults[item][head[1]].value;
		else
			tipo=queryResults[item][head[2]].value;
		if (!tipoLeggibile[tipo])
			tipo = 'unk' //il tipo dell'annotazione non � tra quelli noti
		id = queryResults[item][head[3]].value;
		start = queryResults[item][head[4]].value;
		end = queryResults[item][head[5]].value;
		nome = queryResults[item][head[6]].value;
		mail =queryResults[item][head[7]].value;
		data = queryResults[item][head[8]].value;
		val = queryResults[item][head[9]].value;

		data = componiData(dividiData(data));
		if (queryResults[item][head[10]])
			valLeg=queryResults[item][head[10]].value;
		else if (queryResults[item][head[11]])
			valLeg=queryResults[item][head[11]].value;
		else if (queryResults[item][head[12]])
			valLeg=queryResults[item][head[12]].value;
		else
			valLeg = val;
		if ((ind = start.indexOf('^')) != -1)
			start = start.substr(0,ind);
		if ((ind = end.indexOf('^')) != -1)
			end = end.substr(0,ind);
		start = parseInt(start);
		end = parseInt(end);
		var anc = $('#'+$('.tab-pane.fade.in.active.docStyle')[0].id+" #"+id)[0];
		if (end>start && anc && $(anc).text().length>=end) 
		{ 
			notesRem.push({ id: id, type:tipo, autore: nome, mail: mail, data: data, value: val, valueLeg: valLeg });
			addNoteFromInfo(anc, start, end, tipo, notesRem.length-1);
		}
	}
};

function addNoteFromInfo(ancestor, start, end, tipo, ind) {
	var alltext = [], selez = [], i, cont=0,  offs, offe;
	ancestor.descendantTextNodes(alltext);
	for (i=0; i<alltext.length && start>=cont; i++)
		cont += $(alltext[i]).text().length;
	selez.push(alltext[i-1]);
	offs = start - cont + $(alltext[i-1]).text().length;
	for( ; i<alltext.length && cont<end; i++) 
	{
		cont += $(alltext[i]).text().length;
		selez.push(alltext[i]);
	}
	offe = end - cont + $(alltext[i-1]).text().length;
	insertNote(selez, offs, offe, tipo, false, ind);
};


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
};


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
};


//funzione che passato un vettore del tipo [anno, mese, giorno, ora, minuto] restituisce una stringa con la data nel formato corretto per le annotazioni
function componiData(giorno) {
	return giorno[0]+'-'+giorno[1]+'-'+giorno[2]+'T'+giorno[3]+':'+giorno[4];
};


//funzione che trasforma la stringa relativa alla data di un'annotazione presa dal triple store in una uguale alle nostre
function dividiData(data) {
	var giorno, ora;
	giorno = data.split('T');
	ora = giorno[1].split(':');
	giorno = giorno[0].split('-');
	for (var i=0; i<giorno.length; i++) {
		giorno[i] = dammizero(parseInt(giorno[i]));
		if (i<2)
			ora[i] = dammizero(parseInt(ora[i]));
	}
	return giorno.concat(ora);
};


//funzione che dato un numero, gli aggiunge uno 0 davanti se e' < 10. Usato per comporre la data delle annotazioni
function dammizero(dato)
{
	if(dato < 10)
	{	
		dato = '0'+dato;
	}
	return dato;
};




//funzione che appende al vettore passato come parametro tutti i nodi di testo discendenti del nodo tramite cui si invoca la funzione, in ordine da sinistra a destra
	Node.prototype.descendantTextNodes = function(vet) { 
		for (var i=0; i<this.childNodes.length; i++)
			if (this.childNodes[i].nodeType == 3)
				vet.push(this.childNodes[i]);
			else
				this.childNodes[i].descendantTextNodes(vet);
		return vet.length;
	};


//funzione che restituisce il riferimento al vettore delle annotazioni non salvate se il parametro passato e' una striga uguale a "true", altrimenti al vettore delle annotazioni salvate su triple store
function getRightNotes(temp) {
	if (temp === "true" || temp === true )
		return notes;
	else
		return notesRem;
};
