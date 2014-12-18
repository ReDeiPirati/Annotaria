/*
*	Remote server to call
*/

var serverFuseki = "http://giovanna.cs.unibo.it:8181/data/query";
var serverDbpedia = "http://dbpedia.org/sparql";

/*
*	Dizionario contenente gli URI relativi alla parte di semantic web
*/

prefixUri = { 
	foaf: "http://xmlns.com/foaf/0.1/", 
	fabio: "http://purl.org/spar/fabio/", 
	ao: "http://vitali.web.cs.unibo.it/AnnOtaria/", 
	aop: "http://vitali.web.cs.unibo.it/AnnOtaria/person/", 
	dcterms: "http://purl.org/dc/terms/", 
	rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#", 
	rdfs: "http://www.w3.org/2000/01/rdf-schema#", 
	oa: "http://www.w3.org/ns/oa#",
	schema: "http://schema.org/",
	dbpedia: "http://dbpedia.org/ontology/", 
	skos: "http://www.w3.org/2004/02/skos/core#",
	sem: "http://www.ontologydesignpatterns.org/cp/owl/semiotics.owl#", 
	cito: "http://purl.org/spar/cito/",
	xs: "http://www.w3.org/2001/XMLSchema#",
	frbr: "http://purl.org/vocab/frbr/core#",
	mod: "http://modalnodes.cs.unibo.it/annotaria/"
};

/*
*	variabile contenente tutti i prefissi, usata per le query
*/

var PREFIXES = " \
	prefix foaf: <"+prefixUri['foaf']+">  \
	prefix fabio: <"+prefixUri['fabio']+"> \
	prefix ao: <"+prefixUri['ao']+">  \
	prefix aop: <"+prefixUri['aop']+">  \
	prefix dcterms: <"+prefixUri['dcterms']+">"      
	+
"	prefix rdf: <"+prefixUri['rdf']+">  \
	prefix rdfs: <"+prefixUri['rdfs']+"> \
	prefix oa: <"+prefixUri['oa']+"> \
	prefix schema: <"+prefixUri['schema']+"> \
	prefix dbpedia: <"+prefixUri['dbpedia']+"> \
	prefix skos: <"+prefixUri['skos']+"> \
	prefix sem: <"+prefixUri['sem']+">  \
	prefix cito: <"+prefixUri['cito']+">  \
	prefix xs: <"+prefixUri['xs']+"> \
	prefix frbr: <"+prefixUri['frbr']+">" 
	+
"	prefix mod: <"+prefixUri['mod']+">";

/* degugging purpose */
console.log(PREFIXES);


var query = function( queryttl , success , error ,  loadimg , timeout )
{
	var completeQuery = PREFIXES + queryttl ;
	var encodedquery = encodeURIComponent(completeQuery);
	var queryUrl = serverFuseki + "?query=" + encodedquery + "&format=json";
	var dati = {
			dataType:"jsonp" , 
			url:queryUrl , 
			success:function () 
			{
				success(); //da mettere a posto i parametri
			}
		};

	if ( error )
		dati.error = error;

	var req = $.ajax(dati).always( function(){ $(loadimg).addClass('hide'); } );

	/* degugging purpose */
	console.log(req);	

	$(loadimg).removeClass('hide');

	if (timeout) 
	{
		if (timeout>0)
			setTimeout( function(){ if (req.readyState == 1) req.abort(); }, timeout);
	}

	return req;	
};



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
		var anc = $('#'+$('.tab-pane.active.documento')[0].id+" #"+id)[0];
		if (end>start && anc && $(anc).text().length>=end) { 
			notesRem.push({ id: id, type:tipo, autore: nome, mail: mail, data: data, value: val, valueLeg: valLeg });
			addNoteFromInfo(anc, start, end, tipo, notesRem.length-1);
		}
	}
}



