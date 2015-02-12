var activeDoc = 1;
var usr = {};


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
var annotationSel= "";			//annotazione scelta
var widgetShow = "";				// widget visualizzato
var FragAnnotation = false;	// boolean per dire se e' una annotazione sul documento o sul testo
var currentSelection;				// selezione corrente

//gia presenti in usr
/* modalita annotatore-lettore
modalita = 0; //0 == lettore, 1 == annotatore
nomeAnnotatore = "nome non inserito";
mailAnnotatore = "mail non inserita";

*/

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
//var cliccato = {hasAbstract: '#sommario', denotesPerson: '#annPers', hasPublicationYear: '#annData', hasTitle: '#annTitolo', hasAuthor: '#autore', hasPublisher: '#editore', hasComment: '#commento', hasShortTitle: '#titolo-breve', denotesPlace: '#annLuogo', denotesDisease: '#annMalattia', hasSubject: '#annArgomento', hasClarityScore: '#annChiaro', hasOriginalityScore: '#annOriginale', hasFormattingScore: '#annGiudizio', cites: '#annCita', relatesTo: '#siCollega'}








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



//funzione generica di errore quando il timeout di una richiesta ajax scade
	function timeoutStore() {alert("Errore: triple store non raggiungibile");}


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
	
	$('#MetaTab-' + listId[1]).parent().remove();
	$('#Meta-' + listId[1]).remove();
	
	
	activeDoc --;
	
	if(activeDoc && !$('.doc-area #documentTab li.active').length) { // activeDoc != 0 && tabs.active == 0
		$('.doc-area #documentTab li a').first().trigger("click");
		$('#metaTab li a').first().trigger("click");
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
	$('#manage-nav-button').removeClass('hide');
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

function resetLocalAnnotation() {
	nSpanAnnotazioni = 0; 
	nAnnDoc = 0; 
	notes = []; 
}

function resetProvenance() {
	if (confirm("continuando tutte le annotazioni non salvate andranno perse")) {
		usr.name = "";
		$('#usr_name').val('');
		usr.email = "";
		$('#usr_email').val('');
		titleReader();	
		resetLocalAnnotation();
	}
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
	$('#annote button.btn-success').unbind("click");
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
			resetSelect("DbpediaSelect");
			$('#DbpediaText').val("");
			break;
	}	
}


function selectWid (annotaionSel) {
	switch(annotationSel) {
		case "hasAuthor":
			widgetShow = "widInstance";
			clearWidget("widInstance");
			$('#widInstance').removeClass("hide");	
			query('select ?n ?p where {?p a foaf:Person ; foaf:name ?n . }', elenco, 'InstanceSelect', 'option', timeoutStore, null , defTimeout ,  null);
			var tripla=['fabio:Work',dpref['dcterms']+'creator','foaf:Person'];
			$('#annote button.btn-success').unbind("click").click(function() {insertLocalAnnotation ("hasAuthor", FragAnnotation, "InstanceSelect", tripla, [dpref['aop'],dpref['foaf']+'Person', dpref['foaf']+'name']);});
			break;

		case "hasPublisher":
			widgetShow = "widInstance";
			clearWidget("widInstance");
			$('#widInstance').removeClass("hide");
			var tripla=['fabio:Expression',dpref['dcterms']+'publisher','foaf:Organization'];
			query('select ?n ?p where {  ?p a foaf:Organization ; foaf:name ?n . }', elenco, 'InstanceSelect', 'option',timeoutStore, null ,defTimeout, null);
			$('#annote button.btn-success').unbind("click").click(function() {insertLocalAnnotation ("hasPublisher", FragAnnotation, "InstanceSelect", tripla, [dpref['mod']+'organization/', dpref['foaf']+'Organization', dpref['foaf']+'name']);});
			break;

		case "hasPublicationYear":
			widgetShow = "widDate";
			clearWidget("widDate");
			$('#widDate').removeClass("hide");
			var tripla=['fabio:Expression',dpref['fabio']+'hasPublicationYear','foaf:Person'];
			$('#annote button.btn-success').unbind("click").click(function() {insertLocalAnnotation ("hasPublicationYear", FragAnnotation, "valDate", tripla);});
			break;

		case "hasTitle":
			widgetShow = "widLongText";
			clearWidget("widLongText");
			$('#widLongText').removeClass("hide");
			var tripla=['fabio:Expression',dpref['dcterms']+'title','xs:string'];
			$('#annote button.btn-success').unbind("click").click(function() {insertLocalAnnotation ("hasTitle", FragAnnotation, "valLongText", tripla);});
			break;

		case "hasAbstract":
			widgetShow = "widLongText";
			clearWidget("widLongText");
			$('#widLongText').removeClass("hide");
			var tripla=['fabio:Expression',dpref['dcterms']+'abstract','xs:string'];
			$('#annote button.btn-success').unbind("click").click(function() {insertLocalAnnotation ("hasAbstract", FragAnnotation, "valLongText", tripla);});
			break;

		case "hasShortTitle":
			widgetShow = "widShortText";
			clearWidget("widShortText");
			$('#widShortText').removeClass("hide");
			var tripla=['fabio:Expression',dpref['fabio']+'hasShortTitle','xs:string'];
			$('#annote button.btn-success').unbind("click").click(function() {insertLocalAnnotation ("hasShortTitle", FragAnnotation, "valShortText", tripla);});
			break;

		case "hasComment":
			widgetShow = "widLongText";
			clearWidget("widLongText");
			$('#widLongText').removeClass("hide");
			var tripla=['fabio:Expression',dpref['schema']+'comment','xs:string'];
			$('#annote button.btn-success').unbind("click").click(function() {insertLocalAnnotation ("hasComment", FragAnnotation, "valLongText", tripla);});
			break;

		case "denotesPerson":
			widgetShow = "widInstance";
			clearWidget("widInstance");
			$('#widInstance').removeClass("hide");
			var tripla=['fabio:Expression',dpref['sem']+'denotes','foaf:Person'];
			query('select ?n ?p where {?p a foaf:Person ; foaf:name ?n . }', elenco, 'InstanceSelect', 'option',timeoutStore, null ,defTimeout,  null);
			$('#annote button.btn-success').unbind("click").click(function() {insertLocalAnnotation ("denotesPerson", FragAnnotation, "InstanceSelect", tripla, [dpref['aop'], dpref['foaf']+'Person', dpref['foaf']+'name']);});
			break;

		case "denotesPlace":
			widgetShow = "widInstance";
			clearWidget("widInstance");
			$('#widInstance').removeClass("hide");
			var tripla=['fabio:Expression',dpref['sem']+'denotes','dbpedia:Place'];
			query('select ?n ?p where { ?p a dbpedia:Place ; rdfs:label ?n . }', elenco, 'InstanceSelect', 'option',timeoutStore,null,defTimeout,  null)
			$('#annote button.btn-success').unbind("click").click(function() {insertLocalAnnotation ("denotesPlace", FragAnnotation, "InstanceSelect", tripla, [dpref['mod']+'place/', dpref['dbpedia']+'Place', dpref['rdfs']+'label']);});
			break;

		case "denotesDisease":
			widgetShow = "widInstance";
			clearWidget("widInstance");
			$('#widInstance').removeClass("hide");
			var tripla=['fabio:Expression',dpref['sem']+'denotes','skos:Concept'];
			query('select distinct ?n ?p where { { ?p a skos:Concept ; rdfs:label ?n . ?st rdf:predicate sem:denotes ; rdf:object ?p . } UNION {?p a skos:Concept ; rdfs:label ?n . FILTER contains(str(?p), "/annotaria/disease/") }}', elenco, 'InstanceSelect', 'option',timeoutStore,null,defTimeout,  null);
			$('#annote button.btn-success').unbind("click").click(function() {insertLocalAnnotation ("denotesDisease", FragAnnotation, "InstanceSelect", tripla, [dpref['mod']+'disease/', dpref['skos']+'Concept', dpref['rdfs']+'label']);});
			break;

		case "hasSubject":
			widgetShow = "widInstance";
			clearWidget("widInstance");
			$('#widInstance').removeClass("hide");
			var tripla=['fabio:Expression',dpref['fabio']+'hasSubjectTerm','skos:Concept'];
			query('select ?n ?p where { ?p a skos:Concept ; rdfs:label ?n .  }', elenco, 'InstanceSelect', 'option',timeoutStore,null,defTimeout,null);
			$('#annote button.btn-success').unbind("click").click(function() {insertLocalAnnotation ("hasSubject", FragAnnotation, "InstanceSelect", tripla, [dpref['mod']+'subject/', dpref['skos']+'Concept', dpref['rdfs']+'label']);});
			break;

		case "relatesTo":
			widgetShow = "widDbpedia";
			clearWidget("widDbpedia");
			$('#widDbpedia').removeClass("hide");
			var tripla=['fabio:Expression',dpref['skos']+'related','skos:Concept'];
			$('#annote button.btn-success').unbind("click").click(function() {insertLocalAnnotation ("relatesTo", FragAnnotation, "DbpediaSelect", tripla);});
			break;

		case "hasClarityScore":
			widgetShow = "widChoice";
			clearWidget("widChoice");
			$('#widChoice').removeClass("hide");
			var tripla=['fabio:Expression',dpref['ao']+'hasClarityScore','skos:Concept'];
			$('#annote button.btn-success').unbind("click").click(function() {insertLocalAnnotation ("hasClarityScore", FragAnnotation, "valChoice", tripla);});
			break;

		case "hasOriginalityScore":
			widgetShow = "widChoice";
			clearWidget("widChoice");
			$('#widChoice').removeClass("hide");
			var tripla=['fabio:Expression',dpref['ao']+'hasOriginalityScore','skos:Concept'];
			$('#annote button.btn-success').unbind("click").click(function() {insertLocalAnnotation ("hasOriginalityScore", FragAnnotation, "valChoice", tripla);});
			break;

		case "hasFormattingScore":
			widgetShow = "widChoice";
			clearWidget("widChoice");
			$('#widChoice').removeClass("hide");
			var tripla=['fabio:Expression',dpref['ao']+'hasFormattingScore','skos:Concept'];
			$('#annote button.btn-success').unbind("click").click(function() {insertLocalAnnotation ("hasFormattingScore", FragAnnotation, "valChoice", tripla);});
			break;

		case "cites":
			widgetShow = "widInstance";
			clearWidget("widInstance");
			$('#widInstance').removeClass("hide");
			var tripla=['fabio:Expression',dpref['cito']+'cites','fabio:Expression'];
			query('select ?p where {?p a fabio:Expression . }', elencoDocs, 'InstanceSelect', 'option',timeoutStore,null,defTimeout,  null);
			$('#annote button.btn-success').unbind("click").click(function() {insertLocalAnnotation ("cites", FragAnnotation, "InstanceSelect", tripla, [dpref['ao'], dpref['fabio']+'Expression', dpref['fabio']+'hasRepresentation']);});
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
		
	selectWid(annotationSel);
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
* listMaxHeight
*
* ridimensiona la max-height dell'elemento id passato in proporzione alla wiewport
*/
function listMaxHeight (id) {
	var wpWidth = $(window).width();
	var margin;
	if ( wpWidth > 992) {
		margin = 60 + 60 + 10 + 100;
	}
	else {
		margin = 60 + 30 + 10 + 100;
	}
	
	var docListHeight = $(window).height() - margin;
	$('#' + id).css('max-height', docListHeight);
}



$(document).ready(function () {
	
	listMaxHeight("docList");
	listMaxHeight("documentAnnotation");
	$(window).resize(function () {
		listMaxHeight("docList");
		listMaxHeight("documentAnnotation");
	}); // ridemensiona l'altezza della doc list ogni volta che il documento cambia dimensione
	loadDocList();
	
	$('#sel_reader').toggle();
		
	$('#sel_reader').click(resetProvenance);
	$('#DbpediaSearch').click(function() {
		querydbp("select distinct ?a where {?a rdf:type owl:Thing; foaf:name ?b. FILTER contains(str(?a), \"" + $('#DbpediaText').val() + "\")}", elencoDbp, "DbpediaSelect","option",60000);
	});
	
	$('.doc-area #documentTab li a button.close').click(deleteTab);
	
	/* init per i form delle annotazioni */
	//$('#InstanceText').fadeOut();
		
	var currentYear = new Date().getFullYear();
	for (var i = currentYear; i >= 1900; i--)
		$("#valDate").append('<option value="' + i +'">' + i + '</option>');
	
	$('#valShortText, #valLongText').elastic;



});


