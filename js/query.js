
/* funzione che effettua una query sul triple store
- query e' una stringa che contiene la query da eseguire senza prefissi
- succfunz funzione successo
- id e tag sono variabili da passare a succfunz, insieme al json della risposta alla query , particolarmente utili per le funzioni elenco
- errfunz funzione errore
- timeout e' il tempo massimo di attesa per la richesta 
- initial e' un ulteriore parametro per "succfunz", usato per la modifica delle annotazioni per riprstinare il menu dell'annotazone com'era al momento del salvataggio
*/
function query(query, succfunz, id, tag, errfunz, timeout, initial) {
	var myquery = PREFIXES+query;
	var encodedquery = encodeURIComponent(myquery);
	var queryUrl = endpointURL + "?query=" + encodedquery + "&format=json";
	var dati = {dataType:"jsonp" , url:queryUrl , success:function (d) {succfunz(d,id,tag,initial)}};
	if (errfunz)
		dati.error = errfunz;
	var req = $.ajax(dati);
	if (timeout) {
		if (timeout>0)
			setTimeout(function(){ if (req.readyState == 1) req.abort();}, timeout);
	}
	return req;
}


//funzione che crea l'elenco dei risultati di una query su dbpedia.
function elencoDbp(json, id, tag) {
	$('#'+id+' '+tag).remove();
	var head = json.head.vars;
	var queryResults = json.results.bindings;
	for (var item in queryResults) {
		$('#'+id).append('<'+tag+' value="'+ queryResults[item]["a"].value +'">'+queryResults[item]["a"].value+'</'+tag+'>');
	}
}


//funzione per effettuare una query su dbpedia
function querydbp(query, succfunz, id, tag, timeout) {
	var myquery = query;
	var encodedquery = encodeURIComponent(myquery);
	var encodedgraph = encodeURIComponent("http://dbpedia.org");
	var queryUrl = dbpediaURL + "?default-graph-uri=" + encodedgraph + "&query=" + encodedquery + "&format=json";
	$('#'+id+' '+tag).remove();
	$('#'+id).append('<'+tag+'>sto caricando i documenti...</'+tag+'>');
	var req = $.ajax({dataType:"jsonp" , url:queryUrl , success:function (d) {
		succfunz(d,id,tag)
	}});
	if (timeout) {
		if (timeout>0)
			setTimeout(function(){ if (req.readyState == 1) req.abort();}, timeout);
	}
	return req;

}



//funzione che aggiunge dei tag di tipo "tag" nell'id passato in base al risultato della query.Se "initial" e' passato, viene selezionato il tag con attributo value pari a "initial"
function elenco(json, id, tag, initial) {
	$('#'+id+' '+tag).remove();
	var head = json.head.vars;
	var queryResults = json.results.bindings;
	for (var item in queryResults) {
		$('#'+id).append('<'+tag+' value="'+ queryResults[item][head[1]].value +'">'+queryResults[item][head[0]].value+'</'+tag+'>');
	}
	if(initial) {
		$('option[value="'+initial+'"]').prop('selected', true);
	}
	if ($('#'+id+' '+tag).length == 0)
		$('#'+id).append('<'+tag+' id="vuoto"></'+tag+'>');
		
}


//funzione che crea l'elenco dei documenti citabili per l'annotazione di tipo citazione. 
function elencoDocs(json, id, tag, initial) {
	$('#'+id+' '+tag).remove();
	var head = json.head.vars;
	var queryResults = json.results.bindings;
	for (var item in queryResults) {
		$('#'+id).append('<'+tag+' value="'+ queryResults[item][head[0]].value +'">'+queryResults[item][head[0]].value+'</'+tag+'>');
	}
	if(initial) {
		$('option[value="'+initial+'"]').prop('selected', true);
	}
}



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
			tipo = 'unk' //il tipo dell'annotazione non è tra quelli noti
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
		if (end>start && anc && $(anc).text().length>=end) { 
			notesRem.push({ id: id, type:tipo, autore: nome, mail: mail, data: data, value: val, valueLeg: valLeg });
			addNoteFromInfo(anc, start, end, tipo, notesRem.length-1);
		}
	}
	restoreFilter("ann");
	controlfilter();
}

//funzione che carica le annotazioni sul documento intero di un certo tipo
function getAnnDoc(json, tipo) {
	var head = json.head.vars;
	var queryResults = json.results.bindings;
	for (var item in queryResults) {
		var cont = queryResults[item]['txt'].value;
		var aut = queryResults[item]['nm'].value;
		var mail = queryResults[item]['ml'].value;	
		var data = componiData(dividiData(queryResults[item]['dt'].value));
		insertAnnDoc(tipo, [cont, aut, mail, data]); 		// inserisce l'annotazione tra i metadati
	}
}


