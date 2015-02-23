					/*INIT*/
var dpref = { foaf: "http://xmlns.com/foaf/0.1/", 
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
				 mod: "http://modalnodes.cs.unibo.it/annotaria/"
};	//dizionario contenente gli URI per il semantic web


var defTimeout = 15000;	//timeout di default per le richieste ajax al server fuseki


					/*DOCS*/
var docs = 'http://annotaria.web.cs.unibo.it/documents/'		//URL da cui ricavare l'elenco dei documenti
var activeDoc = 1;																					//contatore delle tab di documenti aperti
var openfirst = false;																			//false se non si ha ancora aperto il primo documento, true altrimenti


					/*MOD*/
var annotationSel= "";			//annotazione scelta
var widgetShow = "";				// widget visualizzato
var FragAnnotation = false;	// falso se l'annotazione e' sul documento, true altrimenti
var currentSelection;				// selezione corrente
var usr = {};								// contiene i dati dell'utente {nome, email}
usr.name = "";							
usr.email = "";

					/*ANN*/
var nSpanAnnotazioni = 0;		//contatore delle annotazioni sul frammento
var nAnnDoc = 0;						//contatore delle annotazione sul documento
var notes = [];							//vettore delle annotazioni temporanee
var notesRem = []; 					//vettore delle annotazioni scaricate dal triple store
var filteraut;				// filtro autore
var tipoLeggibile = { hasAuthor: 'Autore',
										 hasPublisher: 'Editore', 
										 hasPublicationYear: 'Anno', 
										 hasTitle: 'Titolo', hasAbstract: 'Sommario', 
										 hasShortTitle: 'Titolo breve', 
										 hasComment: 'Commento', 
										 denotesPerson: 'Persona', 
										 denotesPlace: 'Luogo', 
										 denotesDisease: 'Malattia', 
										 hasSubject: 'Argomento', 
										 relatesTo: 'Si collega a', 
										 hasClarityScore: 'Chiarezza', 
										 hasOriginalityScore: 'Originalita', 
										 hasFormattingScore: 'Giudizio', 
										 cites: 'Cita', 
										 unk: 'Tipo sconosciuto' 
}; //dizionario con chiave tipo annotazione e come valore una stringa comprensibile a tutti



					/*QUERY*/
var endpointURL = "http://giovanna.cs.unibo.it:8181/data/query";	//URL del triplestore
var PREFIXES = "prefix foaf: <"+dpref['foaf']+"> prefix fabio: <"+dpref['fabio']+"> prefix ao: <"+dpref['ao']+"> prefix aop: <"+dpref['aop']+"> prefix dcterms: <"+dpref['dcterms']+"> PREFIX rdf: <"+dpref['rdf']+"> PREFIX rdfs: <"+dpref['rdfs']+"> prefix oa: <"+dpref['oa']+"> prefix schema: <"+dpref['schema']+"> prefix dbpedia: <"+dpref['dbpedia']+"> prefix skos: <"+dpref['skos']+"> prefix sem: <"+dpref['sem']+"> prefix cito: <"+dpref['cito']+"> prefix xs: <"+dpref['xs']+"> prefix frbr: <"+dpref['frbr']+"> prefix mod: <"+dpref['mod']+"> ";	//stringa con i prefissi usati nelle query rdf

var dbpediaURL = "http://dbpedia.org/sparql";		//URL di dbpedia


/*
* dammizero
*
* aggiunge uno 0 davanti al parametro passata se e' minore di 10
*/
function dammizero(dato)
{
	if(dato < 10)
	{	
		dato = '0'+dato;
	}
	return dato;
}

/*
* dividiData
*
* adatta le date prese dal triple store al nostro standard
*/
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

/*
* timeoutStore
*
* prende un vettore di 4 elementi e restituisce una stringa contenente la data nel formato standard W3C
*/
function componiData(giorno) {
	return giorno[0]+'-'+giorno[1]+'-'+giorno[2]+'T'+giorno[3]+':'+giorno[4];
}

/*
* timeoutStore
*
* funzione di errore per quando scade il tempo
*/
function timeoutStore() {
	alert("Errore: triple store non raggiungibile");
}


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
* verifica in che modalita' si e' chiama closedocument per eliminare le tab. 
*/
function deleteTab() {
	if(usr.name != "") {
		if(confirm("Chiudendo questa tab tutte le annotazioni su quel documento saranno cancellate. Proseguire?")) {	
			var docName = $(this).parent().text();
			docName = docName.substr(2);
			var i = 0;
			if(notes.length != 0) {
				do {
					if( notes[i].doc == docName) 
						deleteLocalAnnotation(notes[i], "");
					else
						i++;
				} while( i < notes.length);
			}
			closeDocument($(this));
		}	
	}
	else
		closeDocument($(this));
}

/*
* closeDocument ()
*
* elimina la tab di cui e' stata cliccata la x e il relativo tabcontent
* rimuove la classe active del documento dalla doc-list
*/
function closeDocument(tag) {
	var tabId = tag.parent().attr("href");
	var listId = tabId.split('-');
	$(tabId).remove();
	tag.parent().parent().remove();
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
*	toggleModeSelector()
*
* esegue il toggle sul selettore del reder e annotator
*/
function toggleModeSelector () {
	$('#sel_annotator').toggle();
	$('#sel_reader').toggle();
}

/*
* titleAnnotator
*
* modifica il navbar-brand e la scritta del mode
* mostra il pulsante annote e manage della navbar
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
* nasconde il pulsante annote e manage della navbar
*/
function titleReader() {
	$('.navbar-brand').text("Leggotaria");
	var htmlString = $('#sel_reader').html();
	htmlString += '&nbsp;<span class="caret"></span>';
	$('#mode').html(htmlString);
	$('#annote-nav-button').addClass('hide');
	$('#manage-nav-button').prop("disabled",true);
	$('#manage-nav-button').addClass('hide');
	toggleModeSelector();
}

/*
* setProvenance
*
* se i campi nome e email sono compilati li salva e passa in modalita' annotator
*/
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

/*
* resetLocalAnnotation
*
* elimina le annotazioni non salvate e azzera i contatori relativi
*/
function resetLocalAnnotation() {
	for( var i = 0; i<notes.length; i++)
		deleteLocalAnnotation( notes[i], undefinedf);
	nAnnDoc = 0; 
	notes = []; 
}

/*
* resetProvenance
*
* resetta i campi nome ed email utente poi torna in modalita lettore
*/
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

/*
*	validSelection()
*
* restituisce true se la selezione e' considerata valida, false altrimenti
*/
function validSelection(sel) {
	if (!sel.collapsed) {
		var anc = sel.commonAncestorContainer;
		if (anc.nodeType == 3) { /* e' un nodo solo di testo quindi prendo il padre */
			anc = anc.parentNode;
		}
		
		var docContent = document.getElementById('documentTabContent');
		return ((anc == docContent || anc.isDescendantOf(docContent)));
	}
	else return false;
}

/*
*	saveSelection
*
*	salva il frammento di testo selezionato al momento della chiamata e resetta il widget annote
*/
function saveSelection() {
	resetAnnoteModalWindow();
	var sel = selection();
	if (sel.rangeCount > 0)
		currentSelection = sel.getRangeAt(0);	
}

/*
*	resetSelect
*
*	riseleziona l'option selezionata inizialmente
*/
function resetSelect( id ) {
	$('select#' + id).find("option:selected").prop("selected", false);
}

/*
*	resetAnnoteModalWindow
*
*	ripristina la finestra modale per creare annotazioni allo stato iniziale
*/
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

/*
* clearWidget
*
* ripristina il widget del tipo passato allo stato iniziale
*/
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
			$('#DbpediaText').val("");
			$("#DbpediaSelect option").remove();
			break;
		case "widChoice":
			resetSelect("valChoice");
			break;
		case "hasFormattingScore":
			resetSelect("valNumber");
			break;
	}	
}

/*
* selectWid
*
* visualizza il widget indicato il annType
* selValue serve a impostare valori preselezionati nelle select
*/
function selectWid (annType, selValue) {
	switch(annType) {
		case "hasAuthor":
			widgetShow = "widInstance";
			clearWidget("widInstance");
			$('#widInstance').removeClass("hide");	
			query('select ?n ?p where {?p a foaf:Person ; foaf:name ?n . }', elenco, 'InstanceSelect', 'option', timeoutStore, defTimeout ,  selValue);
			var tripla=['fabio:Work',dpref['dcterms']+'creator','foaf:Person'];
			$('#annote button.btn-success').unbind("click").click(function() {insertLocalAnnotation ("hasAuthor", FragAnnotation, "InstanceSelect", tripla, [dpref['aop'],dpref['foaf']+'Person', dpref['foaf']+'name']);});
			break;

		case "hasPublisher":
			widgetShow = "widInstance";
			clearWidget("widInstance");
			$('#widInstance').removeClass("hide");
			var tripla=['fabio:Expression',dpref['dcterms']+'publisher','foaf:Organization'];
			query('select ?n ?p where {  ?p a foaf:Organization ; foaf:name ?n . }', elenco, 'InstanceSelect', 'option',timeoutStore,defTimeout, selValue);
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
			query('select ?n ?p where {?p a foaf:Person ; foaf:name ?n . }', elenco, 'InstanceSelect', 'option',timeoutStore,defTimeout,  selValue);
			$('#annote button.btn-success').unbind("click").click(function() {insertLocalAnnotation ("denotesPerson", FragAnnotation, "InstanceSelect", tripla, [dpref['aop'], dpref['foaf']+'Person', dpref['foaf']+'name']);});
			break;

		case "denotesPlace":
			widgetShow = "widInstance";
			clearWidget("widInstance");
			$('#widInstance').removeClass("hide");
			var tripla=['fabio:Expression',dpref['sem']+'denotes','dbpedia:Place'];
			query('select ?n ?p where { ?p a dbpedia:Place ; rdfs:label ?n . }', elenco, 'InstanceSelect', 'option',timeoutStore,defTimeout,  selValue);
			$('#annote button.btn-success').unbind("click").click(function() {insertLocalAnnotation ("denotesPlace", FragAnnotation, "InstanceSelect", tripla, [dpref['mod']+'place/', dpref['dbpedia']+'Place', dpref['rdfs']+'label']);});
			break;

		case "denotesDisease":
			widgetShow = "widInstance";
			clearWidget("widInstance");
			$('#widInstance').removeClass("hide");
			var tripla=['fabio:Expression',dpref['sem']+'denotes','skos:Concept'];
			query('select distinct ?n ?p where { { ?p a skos:Concept ; rdfs:label ?n . ?st rdf:predicate sem:denotes ; rdf:object ?p . } UNION {?p a skos:Concept ; rdfs:label ?n . FILTER contains(str(?p), "/annotaria/disease/") }}', elenco, 'InstanceSelect', 'option',timeoutStore,defTimeout,  selValue);
			$('#annote button.btn-success').unbind("click").click(function() {insertLocalAnnotation ("denotesDisease", FragAnnotation, "InstanceSelect", tripla, [dpref['mod']+'disease/', dpref['skos']+'Concept', dpref['rdfs']+'label']);});
			break;

		case "hasSubject":
			widgetShow = "widInstance";
			clearWidget("widInstance");
			$('#widInstance').removeClass("hide");
			var tripla=['fabio:Expression',dpref['fabio']+'hasSubjectTerm','skos:Concept'];
			query('select ?n ?p where { ?p a skos:Concept ; rdfs:label ?n .  }', elenco, 'InstanceSelect', 'option',timeoutStore,defTimeout,selValue);
			$('#annote button.btn-success').unbind("click").click(function() {insertLocalAnnotation ("hasSubject", FragAnnotation, "InstanceSelect", tripla, [dpref['mod']+'subject/', dpref['skos']+'Concept', dpref['rdfs']+'label']);});
			break;

		case "relatesTo":
			widgetShow = "widDbpedia";
			clearWidget("widDbpedia");
			$('#widDbpedia').removeClass("hide");
			$('#DbpediaText').val(currentSelection.toString());
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
			query('select ?p where {?p a fabio:Expression . }', elencoDocs, 'InstanceSelect', 'option',timeoutStore,defTimeout,  selValue);
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
		
	selectWid(annotationSel, null);
}

/*
* inputFade
*
* nasconde l'elemento idHide mentre mostra l'elemento idShow
*/
function inputFade( idShow, idHide) {
	$('#' + idShow).fadeIn("slow");
	$('#' + idHide).fadeOut("slow");
}
	
/*
* searchDoc 
*
* cerca tutti i documenti nella doc list il cui nome contiene il valore dell'input cerca
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

/*
* selectFilterAll 
*
* esegue il check ti tutti i checkbox relativi ai filtri
*/
function selectFilterAll () {
	$('#filter div.row input:not(:checked)').trigger("click");	
}

/*
* selectFilterNone 
*
* annulla il check ti tutti i checkbox relativi ai filtri
*/
function selectFilterNone () {
	$('#filter div.row input:checked').trigger("click");
}

/*
* restoreFilter 
*
* annulla l'effetto del filtro e rispristina l'effetto degli altri filtri che potrebbero essere stati modificati
*/
function restoreFilter(tipo) {
	switch (tipo) {
		case "ann":
			if( $('#filter form fieldset div.checkbox input[value="selAuthor"]').is(':checked'))
				$('.docStyle span:not([data-autore="' + $('#filterAuthor').val() + '"])').addClass("noneColor");
			if( $('#filter form fieldset div.checkbox input[value="selDate"]').is(':checked')) {
				var data = $( "#filterDate" ).datepicker( "getDate" );
				var list = $('span[data-data]');
				for ( var i=0; i< list.length; i++) {
					var datao = new Date($(list[i]).attr('data-data'));
					if (datao < data)
						$(list[i]).addClass('noneColor');
				}	
			}
			break;
			
		case "date":
			$('.noneColor').removeClass('noneColor');
			controlfilter();
			if( $('#filter form fieldset div.checkbox input[value="selAuthor"]').is(':checked'))
				$('.docStyle span:not([data-autore="' + $('#filterAuthor').val() + '"])').addClass("noneColor");
			break;
			
		case "author":
			$('.docStyle span:not([data-autore="' + filteraut + '"])').removeClass("noneColor");
			controlfilter();
			if( $('#filter form fieldset div.checkbox input[value="selDate"]').is(':checked')) {
				var data = $( "#filterDate" ).datepicker( "getDate" );
				var list = $('span[data-data]');
				for ( var i=0; i< list.length; i++) {
					var datao = new Date($(list[i]).attr('data-data'));
					if (datao < data)
						$(list[i]).addClass('noneColor');
				}	
			}
			break;
	}
}

/*
* controlfilter 
*
* applica tutti i filtri selezionati riguardanti il tipo di annotazioni
*/
function controlfilter() {

	var element = document.getElementsByClassName("colori");

	for(i = 0; i< element.length ; i++)	{
		if(!element[i].checked)
			$('.'+element[i].value).addClass("noneColor");
		else
			$('.'+element[i].value).removeClass("noneColor");
	}
}

/*
* toggleFilterAuthor 
*
* abilita o disabilita il filtro autore
*/
function toggleFilterAuthor() {
	if( $('#filter form fieldset div.checkbox input[value="selAuthor"]').is(':checked'))  {
		$('#filterAuthor').prop('disabled', false);
		filterAuthor();
	}
	else {
		$('#filterAuthor').prop('disabled', true);
		restoreFilter("author");
		filteraut = "";
	}
}

/*
* filterAuthor 
*
* applica o rimuove il filtro per nome dell'annotatore
*/
function filterAuthor() {
	if( filteraut != undefined) { 
		restoreFilter("author");
	}
	filteraut = $('#filterAuthor').val();
	$('.docStyle span:not([data-autore="' + filteraut + '"])').addClass("noneColor");
}

/*
* filterAnn 
*
* applica o rimuove il filtro per tipo di annotazione
*/
function filterAnn(){
	if( $(this).is(':checked')) {
		$('.' + $(this).val()).removeClass('noneColor');	
		restoreFilter('ann');
	}
	else
		$('.' + $(this).val()).addClass('noneColor');
}

/*
* toggleFilterData 
*
* abilita o disabilita il filtro data
*/
function toggleFilterData() {
	if( $('#filter form fieldset div.checkbox input[value="selDate"]').is(':checked')){
		$('#filterDate').prop('disabled', false);
		filterDate();
	}
	else {
		$('#filterDate').prop('disabled', true);
		restoreFilter("date");
	}
}

/*
* filterDate 
*
* applica il filtro per data mostrando le annotazioni effettuate dopo la data inserita
*/
function filterDate() {
	restoreFilter("date");
	
	var data = $( "#filterDate" ).datepicker( "getDate" );
	var list = $('span[data-data]');
	for ( var i=0; i< list.length; i++) {
		var datao = new Date($(list[i]).attr('data-data'));
		if (datao < data)
			$(list[i]).addClass('noneColor');
	}	
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
	
	// ridemensiona l'altezza della doc list e documentAnnotation ogni volta che il documento cambia dimensione
	listMaxHeight("docList");
	listMaxHeight("documentAnnotation");
	$(window).resize(function () {
		listMaxHeight("docList");
		listMaxHeight("documentAnnotation");
	}); 
	
	$('#manage-nav-button').prop("disabled",true);
	$('#annote-nav-button').prop("disabled",true);
	$('#filter input[type="checkbox"]').prop("disabled",true);
	$('#filterDate, #filterAuthor').prop("disabled", true);
	$('#filterDate, #filterAuthor').prop("checked", false);
	$('#filterDate').datepicker({
	altFormat: "yy-mm-dd",
	changeYear: true
	});
	
	loadDocList();
	
	$('#sel_reader').toggle();
		
	$('#sel_reader').click(resetProvenance);

	$('#DbpediaSearch').click(function() {
		querydbp( "SELECT distinct ?uri  WHERE { {   ?uri rdfs:label ?label . FILTER (lang(?label) = \"en\").  ?label bif:contains \"" + $('#DbpediaText').val() + "\" . ?uri dcterms:subject ?blanknode1 } UNION { ?uri dbpprop:name ?dbname . FILTER (lang(?dbname) = \"en\"). ?dbname bif:contains \"" + $('#DbpediaText').val() + "\" . ?uri dcterms:subject ?blanknode2 } UNION { ?uri foaf:name ?fname . FILTER (lang(?fname) = \"en\"). ?fname bif:contains \"" + $('#DbpediaText').val() + "\" .?uri dcterms:subject ?blanknode3 } } LIMIT 1000", elencoDbp, "DbpediaSelect","option", 60000 ); });

	
	$('#annShowSelect').on('change', switchAnnotationInfo );
	
	$('.doc-area #documentTab li a button.close').click(deleteTab);
	
	
	$('.colori').on( 'click' , filterAnn);
	$('#filterAuthor').on('change', filterAuthor);
	$('#filterDate').on('change', filterDate);
		
	// riempo la select del widget data
	var currentYear = new Date().getFullYear();
	for (var i = currentYear; i >= 1900; i--)
		$("#valDate").append('<option value="' + i +'">' + i + '</option>');
	
	$('#valShortText, #valLongText').elastic;



});
