var activeDoc = 1;
var usr = {};
var annotationSel= "";
var widgetShow = "";
var FragAnnotation = false;
var currentSelection;

					/*INIT*/

//dizionario contenente gli URI relativi alla parte di semantic web
dpref = { foaf: "http://xmlns.com/foaf/0.1/", fabio: "http://purl.org/spar/fabio/", 
	ao: "http://vitali.web.cs.unibo.it/AnnOtaria/", aop: "http://vitali.web.cs.unibo.it/AnnOtaria/person/", 
	dcterms: "http://purl.org/dc/terms/", rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#", 
	rdfs: "http://www.w3.org/2000/01/rdf-schema#", oa: "http://www.w3.org/ns/oa#",
	schema: "http://schema.org/", dbpedia: "http://dbpedia.org/ontology/", 
	skos: "http://www.w3.org/2004/02/skos/core#", sem: "http://www.ontologydesignpatterns.org/cp/owl/semiotics.owl#", 
	cito: "http://purl.org/spar/cito/", xs: "http://www.w3.org/2001/XMLSchema#",
	mod: "http://modalnodes.cs.unibo.it/annotaria/"
};

//timeout di default per le richieste ajax al server fuseki
defTimeout = 15000;


					/*DOCS*/

//URL da cui ricavare l'elenco dei documenti
var docs = 'http://annotaria.web.cs.unibo.it/documents/'



					/*MOD*/

/* modalita annotatore-lettore */
modalita = 0; //0 == lettore, 1 == annotatore
nomeAnnotatore = "nome non inserito";
mailAnnotatore = "mail non inserita";



					/*ANN*/

//variabili relative alle annotazioni
var selezioneUtente = document.createRange(); //range relativo all'ultima selezione dell'utente
selezioneUtente.collapse(false);
nSpanAnnotazioni = 0; //per rendere unico l'id di ogni span usato per le annotazioni su frammento usiamo questo contatore
nAnnDoc = 0; //come sopra ma per le annotazioni sul documento
notes = []; //vettore delle annotazioni non ancora salvate dell'utente
notesRem = []; //vettore delle annotazioni trovate sul triple store

var primo=true, ultimo;

//dizionario con chiave tipo annotazione e come valore una stringa comprensibile a tutti
tipoLeggibile = { hasAuthor: 'Autore', hasPublisher: 'Editore', hasPublicationYear: 'Anno', hasTitle: 'Titolo', hasAbstract: 'Sommario', hasShortTitle: 'Titolo breve', hasComment: 'Commento', denotesPerson: 'Persona', denotesPlace: 'Luogo', denotesDisease: 'Malattia', hasSubject: 'Argomento', relatesTo: 'Si collega a', hasClarityScore: 'Chiarezza', hasOriginalityScore: 'Originalita', hasFormattingScore: 'Giudizio', cites: 'Cita', unk: 'Tipo sconosciuto' };


					/*QUERY*/

//the triplestore
var endpointURL = "http://giovanna.cs.unibo.it:8181/data/query";

//variabile contenente tutti i prefissi, usata per le query
var PREFIXES = "prefix foaf: <"+dpref['foaf']+"> prefix fabio: <"+dpref['fabio']+"> prefix ao: <"+dpref['ao']+"> prefix aop: <"+dpref['aop']+"> prefix dcterms: <"+dpref['dcterms']+"> PREFIX rdf: <"+dpref['rdf']+"> PREFIX rdfs: <"+dpref['rdfs']+"> prefix oa: <"+dpref['oa']+"> prefix schema: <"+dpref['schema']+"> prefix dbpedia: <"+dpref['dbpedia']+"> prefix skos: <"+dpref['skos']+"> prefix sem: <"+dpref['sem']+"> prefix cito: <"+dpref['cito']+"> prefix xs: <"+dpref['xs']+"> prefix frbr: <"+dpref['frbr']+"> prefix mod: <"+dpref['mod']+"> ";

var dbpediaURL = "http://dbpedia.org/sparql"




					/*EDIT*/

//dizionario con chiave tipo annotazione e valore id del pulsante corrispondente nella pagina html
var cliccato = {hasAbstract: '#sommario', denotesPerson: '#annPers', hasPublicationYear: '#annData', hasTitle: '#annTitolo', hasAuthor: '#autore', hasPublisher: '#editore', hasComment: '#commento', hasShortTitle: '#titolo-breve', denotesPlace: '#annLuogo', denotesDisease: '#annMalattia', hasSubject: '#annArgomento', hasClarityScore: '#annChiaro', hasOriginalityScore: '#annOriginale', hasFormattingScore: '#annGiudizio', cites: '#annCita', relatesTo: '#siCollega'}






/*
* checkTab
*
* se le tab esistenti sono meno di 2 nasconde i tab, al contrario li mostra
*/
function checkTab() {
	if (activeDoc < 2)
		$('.doc-area #documentTab').fadeOut();
	else
		$('.doc-area #documentTab').fadeIn();
}

/*
* deleteTab ()
*
* elimina la tab di cui e' stata cliccata la x e il relativo tabcontent
* rimuove la classe active del documento dalla doc-list
*/
function deleteTab() {
	var tabId = $(this).parent().attr("href");
	var listId = tabId.split('-');
	$(tabId).remove();
	$(this).parent().parent().remove();
	$('#' + listId[1]).removeClass('active');
	
	activeDoc --;
	
	if(activeDoc && !$('.doc-area #documentTab li.active').length) { // activeDoc != 0 && tabs.active == 0
		$('.doc-area #documentTab li a').first().trigger("click");
	}
	checkTab();
}

/*
*	addTab()
*
* aggiunge una nuova tab e il relativo tabcontent
* la nuova tab e' aggiunta attiva
* viene caricato il documento al suo interno e aggiunta la classe active all'elemento della doc-list collegato
*/



function toggleModeSelector () {
	$('#sel_annotator').toggle();
	$('#sel_reader').toggle();
}

/*
* titleAnnotator
*
* modifica il navbar-brand e la scritta del mode
* mostra il pulsante annote della navbar
*/

function titleAnnotator() {
	$('.navbar-brand').text("Annotaria");
	var htmlString =  '<span class="glyphicon glyphicon-pencil">&nbsp;</span>' + usr.name; 
	htmlString += '&nbsp;<span class="caret"></span>';
	$('#mode').html( htmlString );
	$('#annote-nav-button').removeClass('hide');
	toggleModeSelector();
}

/*
* titleReader
*
* modifica il navbar-brand e la scritta del mode 
* nasconde il pulsante annote della navbar
*/

function titleReader() {
	$('.navbar-brand').text("Leggotaria");
	var htmlString = $('#sel_reader').html();
	htmlString += '&nbsp;<span class="caret"></span>';
	$('#mode').html(htmlString);
	$('#annote-nav-button').addClass('hide');
	toggleModeSelector();
}


function setProvenance() {
	if (!$('#usr_name').val()) {
		$('#usr_name').trigger("focus");
		return;
	}
	if (!$('#usr_email').val() || $('#usr_email').val().indexOf("@") == -1) {
		$('#usr_email').trigger("focus");
		return;
	}
	
	usr.name = $('#usr_name').val();
	usr.email = $('#usr_email').val();
	$("#modalProvenance").modal("hide");
	titleAnnotator();	
}

function resetProvenance() {
	usr.name = "";
	$('#usr_name').val('');
	usr.email = "";
	$('#usr_email').val('');
	titleReader();	
}
/*
*	selection()
*
* funzione che restituisce il testo selezionato
*/
function selection() {
	if (window.getSelection) {
		return window.getSelection();
	} else if (document.getSelection) {
		return document.getSelection();
	} else if (document.selection) {
		return document.selection.createRange().text;
	}
}

function validSelection(sel) {
	if (!sel.collapsed) {
		//var selRange = sel.getRangeAt(0);
		//var anc = selRange.commonAncestorContainer;
		var anc = sel.commonAncestorContainer;
		if (anc.nodeType == 3) { /* e' un nodo solo di testo quindi prendo il padre */
			anc = anc.parentNode;
		}
		
		var docContent = document.getElementById('documentTabContent');
		var defaultdoc = document.getElementById('Doc1'); 
		return ((anc == docContent || anc.isDescendantOf(docContent)) && anc != defaultdoc && !anc.isDescendantOf(defaultdoc));
	}
	else return false;
}

/*
*	saveSelection
*
*	salva il frammento di testo selezionato al momento della chiamata
*/
function saveSelection() {
	currentSelection = selection().getRangeAt(0);
}

function resetSelect( id ) {
	$('select#' + id).find("option:selected").prop("selected", false);
}

function resetAnnoteModalWindow() {
	if (widgetShow != "")
			$('#' + widgetShow).addClass('hide');
		
	resetSelect("documentAnnotationType");
	resetSelect("fragmentAnnotationType");
	
	FragAnnotation = false;
	$('#documentAnnotationForm').removeClass('hide');
	$('#fragmentAnnotationForm').addClass('hide');
}

/*
* switchAnnotationType
*
* cambia la select da visualizzare in base al tipo di annotazione da effettuare (documento/frammento)
* le annnotazioni sul documento possono essere effettuate solo se e' selezionato del testo
*/
function switchAnnotationType() {
	
	if (FragAnnotation || validSelection(currentSelection)){ 
		if (widgetShow != "")
			$('#' + widgetShow).addClass('hide');
		
		resetSelect("documentAnnotationType");
		resetSelect("fragmentAnnotationType");
		
		$('#documentAnnotationForm').toggleClass('hide');
		$('#fragmentAnnotationForm').toggleClass('hide');
		if (FragAnnotation)
			FragAnnotation = false;
		else
			FragAnnotation = true;
	}
}

function clearWidget( type ) {
	switch( type ) {
		case "widInstance":
			resetSelect("InstanceSelect");
			$('#InstanceText').val("");
			$($('#widInstance input')[0]).trigger("click");
			break;
		case "widDate":
			resetSelect("valDate");
			break;
		case "widLongText":
			$('#valLongText').val("");
			break;
		case "widShortText":
			$('#valShortText').val("");
		case "widDbpedia":
			break;
		case "widChoice":
			resetSelect("valChoice");
			break;
		case "hasFormattingScore":
			resetSelect("valNumber");
			break;
		case "widCitation":
			break;
	}	
}

/*
* showAnnotationForm
*
* mostra i campi del form dell'annotazione selezionata
*/
function showAnnotationForm() {
	if (widgetShow != "")
		$('#' + widgetShow).addClass('hide');
	if(!FragAnnotation)
		annotationSel = $('select#documentAnnotationType').find("option:selected").attr("value");
	else
		annotationSel = $('select#fragmentAnnotationType').find("option:selected").attr("value");
		
	switch(annotationSel) {
    	case "hasAuthor":
			widgetShow = "widInstance";
			clearWidget("widInstance");
			$('#widInstance').removeClass("hide");
        	break;
		case "hasPublisher":
			widgetShow = "widInstance";
			clearWidget("widInstance");
			$('#widInstance').removeClass("hide");
        	break;
		case "hasPublicationYear":
			widgetShow = "widDate";
			clearWidget("widDate");
			$('#widDate').removeClass("hide");
        	break;
		case "hasTitle":
        	widgetShow = "widLongText";
			clearWidget("widLongText");
			$('#widLongText').removeClass("hide");
        	break;
		case "hasAbstract":
        	widgetShow = "widLongText";
			clearWidget("widLongText");
			$('#widLongText').removeClass("hide");
        	break;
		case "hasShortTitle":
        	widgetShow = "widShortText";
			clearWidget("widShortText");
			$('#widShortText').removeClass("hide");
        	break;
		case "hasComment":
        	widgetShow = "widLongText";
			clearWidget("widLongText");
			$('#widLongText').removeClass("hide");
        	break;
		case "denotesPerson":
			widgetShow = "widInstance";
			clearWidget("widInstance");
			$('#widInstance').removeClass("hide");
        	break;
		case "denotesPlace":
			widgetShow = "widInstance";
			clearWidget("widInstance");
			$('#widInstance').removeClass("hide");
        	break;
		case "denotesDisease":
			widgetShow = "widInstance";
			clearWidget("widInstance");
			$('#widInstance').removeClass("hide");
        	break;
		case "hasSubject":
			widgetShow = "widInstance";
			clearWidget("widInstance");
			$('#widInstance').removeClass("hide");
        	break;
		case "relatesTo":
			widgetShow = "widDbpedia";
			clearWidget("widDbpedia");
			$('#widDbpedia').removeClass("hide");
        	break;
		case "hasClarityScore":
			widgetShow = "widChoice";
			clearWidget("widChoice");
			$('#widChoice').removeClass("hide");
        	break;
		case "hasOriginalityScore":
			widgetShow = "widChoice";
			clearWidget("widChoice");
			$('#widChoice').removeClass("hide");
        	break;
		case "hasFormattingScore":
			widgetShow = "widChoice";
			clearWidget("widChoice");
			$('#widChoice').removeClass("hide");
        	break;
		case "cites":
			widgetShow = "widCitation";
			clearWidget("widCitation");
			$('#widCitation').removeClass("hide");
        	break;
    } 
}

function inputFade( idShow, idHide) {
	$('#' + idShow).fadeIn("slow");
	$('#' + idHide).fadeOut("slow");
}
	
/*
* searchDoc 
*
* cerca tutti i documenti nella doc list il cui nome inizia con il valore dell'input cerca
*/
function searchDoc() {
	var docVal = $('#cerca input').val();
	$("#docList a:not(.found)").show();
	$('.found').removeClass('found');
	if (docVal != "") {
		$("#docList a[name*='" + docVal + "']").addClass('found'); 
		var docListVector = $('#docList a');
		$("#docList a:not(.found)").hide();
	}
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





/*
* loadDocList
*
* carica i documenti dal lind docs e li inserisce in una tabella
* se i documenti sono piu' di 10 mostra i pulsanti per lo switch di pagina
*
*/
function loadDocList() {
	$.ajax({
		method: 'GET',
		url: docs,
		success: function(d) {
			var vet = $(d).find('a');
			var str = '.html';
			var itemId;
			for (var i = 0; i < vet.length ; i++) {
				var link = $(vet[i]).attr('href');
				
				if (link.indexOf(str, link.length - str.length) !== -1) { // controlla se il file e' .html
					itemId = "dc" + i;
					var label = link.substr(0, link.length - str.length);
					
					$('#docList').append("<a id='" + itemId + "' name='" + label + "' class='list-group-item' onclick='openDoc(\"" + label + "\", \"" + itemId + "\")' >" + label + "</a>");
				}
			}			
		},
		error: function(a,b,c) {
			alert('Error on load of the document');
		}
	});
	
	$('#cerca input').on('change', searchDoc);
}






function openDoc( title, itemId ) { 
	
	if ($('#' + itemId).hasClass('active')) { //set the focus on the document
		$( '#' + itemId + '-tab').trigger("click");
	}
	else {
		$.ajax({
			method: 'GET',
			url:  docs + title + '.html',
			success: function(d) {
				$('#' + itemId).toggleClass('active');
				activeDoc ++;

				$('.doc-area #documentTab li.active').removeClass('active');
				$('.doc-area #documentTabContent div.active').removeClass('active');

				$('.doc-area #documentTab').append('<li role="presentation" class="active doc-tabs"><a href="#Doc-' + itemId +'" id="' + itemId +'-tab" role="tab" data-toggle="tab" aria-controls="Doc-' + itemId +'" aria-expanded="true"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&nbsp;&times;</button>' + title +'</a></li>');

				$('.doc-area #documentTabContent').append('<div role="tabpanel" class="tab-pane fade in active docStyle" id="Doc-' + itemId +'" aria-labelledBy="' + itemId +'-tab">');

				$('#Doc-' + itemId).html(d);
				/* aggiorno i link dei css  
				var links = $('#Doc-' + title + ' link');
				for (var i=0; i<links.length; i++) {
					var href = $(links[i]).attr('href');
					$(links[i]).attr('href', docs + href);
				}
				*/
				
				/* aggiorno i link delle immagini */
				var imgs = $('#Doc-' + itemId + ' img');			
				for (var i=0; i<imgs.length; i++) {
					var src = $(imgs[i]).attr('src');
					$(imgs[i]).attr('src', docs + src);
				}

				$('#' + itemId + '-tab button.close').click(deleteTab);
				checkTab();

				
				//chiamata per chiedere tutte le annotazioni sull'intero documento
				caricaAnnDoc();


				//query per chiedere tutte le annotazioni su frammento relative al documento in questione
			query('SELECT ?a ?tp ?lb ?id ?st ?en ?nm ?ml ?dt ?val ?v1 ?v2 ?v3 WHERE { ?a a oa:Annotation ; oa:hasTarget ?t ;  oa:annotatedBy ?aut ; oa:annotatedAt ?dt ; oa:hasBody ?b . ?t a oa:SpecificResource. ?t oa:hasSource <'+dpref['ao'] + title + '.html' + '>. ?t oa:hasSelector ?s . ?s a oa:FragmentSelector ; oa:end ?en ; oa:start ?st ; rdf:value ?id . ?aut foaf:name ?nm ; schema:email ?ml . ?b rdf:object ?val . OPTIONAL { ?a rdfs:label ?lb . } OPTIONAL { ?a ao:type ?tp . } OPTIONAL { ?val foaf:name ?v1 . } OPTIONAL { ?val rdfs:label ?v2 . } OPTIONAL { ?b rdfs:label ?v3 . } }', caricaAnn, undefined, undefined, function () {alert("Impossibile caricare le annotazioni, il triple store non \u00E8 raggiungibile")}, '#caricaDoc',defTimeout);

		


			},
			error: function(a,b,c) {
				alert('Error on load ' + docs + title + '.html');
			}
		});
	}
}




//funzione che fa una query per ogni tipo di annotazione sul documento
function caricaAnnDoc() {
	var doc = $('#titoloAttivo').text()+'.html';
	$('#caricaAnnDoc').removeClass('hide');
	$.when( 
		query('select ?txt ?nm ?ml ?dt where { ?ann a oa:Annotation ; oa:hasTarget <'+dpref['ao']+doc+'> ; oa:hasBody ?b ; oa:annotatedBy ?aut ; oa:annotatedAt ?dt . ?aut schema:email ?ml ; foaf:name ?nm . ?b rdf:predicate dcterms:creator ; rdf:object ?cr . ?cr a foaf:Person ; foaf:name ?txt . } order by ?dt ', getAnnDoc, 'hasAuthor', undefined, undefined, undefined, defTimeout ),
		query('select ?txt ?nm ?ml ?dt where { ?ann a oa:Annotation ; oa:hasTarget <'+dpref['ao']+doc+'> ; oa:hasBody ?b ; oa:annotatedBy ?aut ; oa:annotatedAt ?dt . ?aut schema:email ?ml ; foaf:name ?nm . ?b rdf:predicate dcterms:publisher; rdf:object ?p . ?p a foaf:Organization ; foaf:name ?txt . } order by ?dt ', getAnnDoc, 'hasPublisher', undefined, undefined, undefined, defTimeout ),
		query('select ?txt ?nm ?ml ?dt where { ?ann a oa:Annotation ; oa:hasTarget <'+dpref['ao']+doc+'> ; oa:hasBody ?b ; oa:annotatedBy ?aut ; oa:annotatedAt ?dt . ?aut schema:email ?ml ; foaf:name ?nm . ?b rdf:predicate fabio:hasPublicationYear ; rdf:object ?txt .  } order by ?dt ', getAnnDoc, 'hasPublicationYear', undefined, undefined, undefined, defTimeout ),
		query('select ?txt ?nm ?ml ?dt where { ?ann a oa:Annotation ; oa:hasTarget <'+dpref['ao']+doc+'> ; oa:hasBody ?b ; oa:annotatedBy ?aut ; oa:annotatedAt ?dt . ?aut schema:email ?ml ; foaf:name ?nm . ?b rdf:predicate dcterms:title ; rdf:object ?txt .  } order by ?dt ', getAnnDoc, 'hasTitle', undefined, undefined, undefined, defTimeout ),
		query('select ?txt ?nm ?ml ?dt where { ?ann a oa:Annotation ; oa:hasTarget <'+dpref['ao']+doc+'> ; oa:hasBody ?b ; oa:annotatedBy ?aut ; oa:annotatedAt ?dt . ?aut schema:email ?ml ; foaf:name ?nm . ?b rdf:predicate dcterms:abstract; rdf:object ?txt .  } order by ?dt ', getAnnDoc, 'hasAbstract', undefined, undefined, undefined, defTimeout ),
		query('select ?txt ?nm ?ml ?dt where { ?ann a oa:Annotation ; oa:hasTarget <'+dpref['ao']+doc+'> ; oa:hasBody ?b ; oa:annotatedBy ?aut ; oa:annotatedAt ?dt . ?aut schema:email ?ml ; foaf:name ?nm . ?b rdf:predicate fabio:hasShortTitle; rdf:object ?txt .  } order by ?dt ', getAnnDoc, 'hasShortTitle', undefined, undefined, undefined, defTimeout ),
		query('select ?txt ?nm ?ml ?dt where { ?ann a oa:Annotation ; oa:hasTarget <'+dpref['ao']+doc+'> ; oa:hasBody ?b ; oa:annotatedBy ?aut ; oa:annotatedAt ?dt . ?aut schema:email ?ml ; foaf:name ?nm . ?b rdf:predicate schema:comment ; rdf:object ?txt .  } order by ?dt ', getAnnDoc, 'hasComment', undefined, undefined, undefined, defTimeout )
	).always(function () {$('#caricaAnnDoc').addClass('hide');});
}




/* funzione generica per effettuare una query sul triple store
- il parametro "query" e' una stringa contenente la query da eseguire, senza prefissi
- "succfunz" e' la funzione da eseguire se la query ha successo
- "id" e "tag" sono variabili passate come parametro a succfunz, insieme al json della risposta alla query
- "errfunz" e' la funzione da eseguire se la richiesta non ha successo
- "loadId" e' l'id dell'immagine da mostrare mentre la richiesta e' in corso
- "timeout" e' il tempo massimo di attesa oltre il quale si presume che la richesta sia fallita
- "initial" e' un ulteriore parametro per "succfunz", usato per la modifica delle annotazioni per riprstinare il menu dell'annotazone com'era al momento del salvataggio
*/
function query(query, succfunz, id, tag, errfunz, loadId, timeout, initial) {
	var myquery = PREFIXES+query;
	var encodedquery = encodeURIComponent(myquery);
	var queryUrl = endpointURL + "?query=" + encodedquery + "&format=json";
	var dati = {dataType:"jsonp" , url:queryUrl , success:function (d) {succfunz(d,id,tag,initial)}};
	if (errfunz)
		dati.error = errfunz;
	var req = $.ajax(dati).always(function () {$(loadId).addClass('hide')});
	$(loadId).removeClass('hide');
	if (timeout) {
		if (timeout>0)
			setTimeout(function(){ if (req.readyState == 1) req.abort();}, timeout);
	}
	return req;
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
		insertAnnDoc(tipo, [cont, aut, mail, data]);
	}
}



//funzione che dato un numero, gli aggiunge uno 0 davanti se e' < 10. Usato per comporre la data delle annotazioni
function dammizero(dato)
{
	if(dato < 10)
	{	
		dato = '0'+dato;
	}
	return dato;
}


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
}


//funzione che passato un vettore del tipo [anno, mese, giorno, ora, minuto] restituisce una stringa con la data nel formato corretto per le annotazioni
function componiData(giorno) {
	return giorno[0]+'-'+giorno[1]+'-'+giorno[2]+'T'+giorno[3]+':'+giorno[4];
}






/* funzione che date informazioni su un'annotazione su frammento presa dal triple store prepara i dati necessari a insertNote per renderla visibile
- il parametro "ancestor" e' una stringa con l'id dell'antenato comune ai nodi di inizio e fine dell'annotazione
- "start" e "end" sono gli offset dell'annotazione in base ad "ancestor"
- "tipo" e' il tipo dell'annotazione
- "ind" e' la posizione di questa annotazione nel vettore notesRem, da inserire come attributo degli span
*/
function addNoteFromInfo(ancestor, start, end, tipo, ind) {
	var alltext = [], selez = [], i, cont=0,  offs, offe;
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



//funzione che data una stringa rappresentante una data in formato consono al semantic web la rende leggibile a tutti gli utenti
function dataLeggibile(data) {
	return data.replace('T', ', ');
}



//funzione che restituisce la posizione di un nodo in una lista di nodi
	NodeList.prototype.indexOf = function(n) { 
		var i=0; 
		while (this.item(i) !== n) {i++;}
		return i ;
	};
	
	//funzione che restituisce il primo nodo antenato che non sia uno span di annotazione
	Node.prototype.nonAnnAncestor = function () {
		var id, anc = this;
		do {
			anc.son = anc
			anc = anc.parentNode;
			id = anc.id;
		} while (id.indexOf("span-ann") != -1);
		return anc;
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
	
	//funzione che restituisce true se il nodo tramite cui viene chiamata e' discendente del nodo passato come parametro, false altrimenti
	Node.prototype.isDescendantOf = 
	function(anc) {
		var tmp = this.parentNode;
		while (tmp) {
			if (tmp == anc)
				return true;
			else
				tmp=tmp.parentNode;
		}
		return false;
	};






function selectFilterAll () {
	$('#filter div.row input:checkbox').attr("checked","checked");
}

function selectFilterNone () {
	$('#filter div.row input:checked').prop('checked', false);
}

function toggleFilterData() {
	if( $('#filter form fieldset div.checkbox input[value="selDate"]').is(':checked'))
		$('#filterDate').prop('disabled', false);
	else
		$('#filterDate').prop('disabled', true);
}

function toggleFilterAuthor() {
	if( $('#filter form fieldset div.checkbox input[value="selAuthor"]').is(':checked'))
		$('#filterAuthor').prop('disabled', false);
	else
		$('#filterAuthor').prop('disabled', true);
}

function activeFilter () {
	$('#filter div.row input:checkbox, #filter form fieldset').prop('disabled', false);
}

function disableFilter () {
	$('#filter div.row input:checkbox, #filter form fieldset').prop('disabled', true);
	selectFilterAll();
	$('#filter form fieldset input:checked').prop('checked', false);
}

/*
* docListMaxHeight
*
* ridimensiona la max-height dell'elemento doc-list in proporzione alla wiewport
*/
function docListMaxHeight () {
	var wpWidth = $(window).width();
	var margin;
	if ( wpWidth > 992) {
		margin = 60 + 60 + 10 + 100;
	}
	else {
		margin = 60 + 30 + 10 + 100;
	}
	
	var docListHeight = $(window).height() - margin;
	$('#docList').css('max-height', docListHeight);
}

/*
*		isDescendantOf
*
*		funzione che restituisce true se il chiamante e' discendente del parametro, false altrimenti
*/
Node.prototype.isDescendantOf = function(padre) {
	
	var tmp = this.parentNode;
	
	while (tmp) {
		if (tmp == padre)
			return true;
		else
			tmp=tmp.parentNode;
	}
	return false;
}

$(document).ready(function () {
	
	docListMaxHeight();
	$(window).resize(docListMaxHeight); // ridemensiona l'altezza della doc list ogni volta che il documento cambia dimensione
	loadDocList();
	
	$('#sel_reader').toggle();
		
	$('#sel_reader').click(resetProvenance);
	
	$('.doc-area #documentTab li a button.close').click(deleteTab);
	
	/* init per i form delle annotazioni */
	//$('#InstanceText').fadeOut();
		
	var currentYear = new Date().getFullYear();
	for (var i = currentYear; i >= 1900; i--)
		$("#valDate").append('<option value="' + i +'">' + i + '</option>');
	
	$('#valShortText, #valLongText').elastic;
});


