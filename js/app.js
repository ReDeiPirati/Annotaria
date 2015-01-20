var activeDoc = 1;
var usr = {};
var annotationSel= "";
var widgetShow = "";
var docs = 'http://annotaria.web.cs.unibo.it/documents/';
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
			},
			error: function(a,b,c) {
				alert('Error on load ' + docs + title + '.html');
			}
		});
	}
}

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
		var anc = sel.commonAncestorContainer;
		if (anc.nodeType == 3) { /* e' un nodo solo di testo quindi prendo il padre */
			anc = anc.parentNode;
		}
		
		var docContent = document.getElementById('documentTabContent');
		var defaultdoc = document.getElementById('doc1'); 
		return ((anc == docContent || anc.isDescendantOf(docContent)) && anc != defaultdoc && !anc.isDescendantOf(defaultdoc));
	}
	else return false;
}

/*
* switchAnnotationType
*
* cambia la select da visualizzare in base al tipo di annotazione da effettuare (documento/frammento)
* le annnotazioni sul documento possono essere effettuate solo se e' selezionato del testo
*/
function switchAnnotationType() {
//	if (validSelection(selection())){ 
		$('#documentAnnotationForm').toggleClass('hide');
		$('#fraqmentAnnotationForm').toggleClass('hide');
//	}
//	else
//		alert("Non e' stato selezionato alcun testo o il testo selezionato non e' corretto");
}

/*
* showDocumentAnnotationForm
*
* mostra i campi del form dell'annotazione sul documento selezionata
*/
function showDocumentAnnotationForm() {
	if (widgetShow != "")
		$('#' + widgetShow).addClass('hide');
	
	annotationSel = $('select#documentAnnotationType option:selected').attr("value");
	//$('#' + lastAnnotationSel +'Form').removeClass('hide');
	switch(annotationSel) {
    	case "hasAuthor":
			widgetShow = "widInstance";
			$('#widInstance').removeClass("hide");
        	break;
		case "hasPublisher":
			widgetShow = "widInstance";
			$('#widInstance').removeClass("hide");
        	break;
		case "hasPublicationYear":
			widgetShow = "widDate";
			$('#widDate').removeClass("hide");
        	break;
		case "hasTitle":
        	widgetShow = "widLongText";
			$('#widLongText').removeClass("hide");
        	break;
		case "hasAbstract":
        	widgetShow = "widLongText";
			$('#widLongText').removeClass("hide");
        	break;
		case "hasShortTitle":
        	widgetShow = "widShortText";
			$('#widShortText').removeClass("hide");
        	break;
		case "hasComment":
        	widgetShow = "widLongText";
			$('#widLongText').removeClass("hide");
        	break;
		case "denotesPerson":
			widgetShow = "widInstance";
			$('#widInstance').removeClass("hide");
        	break;
		case "denotesPlace":
			widgetShow = "widInstance";
			$('#widInstance').removeClass("hide");
        	break;
		case "denotesDisease":
			widgetShow = "widInstance";
			$('#widInstance').removeClass("hide");
        	break;
		case "hasSubject":
			widgetShow = "widInstance";
			$('#widInstance').removeClass("hide");
        	break;
		case "relatesTo":
			widgetShow = "widDbpedia";
			$('#widDbpedia').removeClass("hide");
        	break;
		case "hasClarityScore":
			widgetShow = "widChoice";
			$('#widChoice').removeClass("hide");
        	break;
		case "hasOriginalityScore":
			widgetShow = "widChoice";
			$('#widChoice').removeClass("hide");
        	break;
		case "hasFormattingScore":
			widgetShow = "widChoice";
			$('#widChoice').removeClass("hide");
        	break;
		case "cites":
			widgetShow = "widCitation";
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

$(document).ready(function () {
	
	docListMaxHeight();
	$(window).resize(docListMaxHeight); // ridemensiona l'altezza della doc list ogni volta che il documento cambia dimensione
	loadDocList();
	
	$('#sel_reader').toggle();
	//$('#submitProvenance').click(setProvenance);
	
	
	$('#sel_reader').click(resetProvenance);
	
	$('.doc-area #documentTab li a button.close').click(deleteTab);
	
	/* init per i form delle annotazioni */
	$('#InstanceText').fadeOut();
	$('#valShortText, #valLongText').elastic();
	
	var currentYear = new Date().getFullYear();
	for (var i = currentYear; i >= 1900; i--)
		$("#valDate").append('<option value="' + i +'">' + i + '</option>');
});


