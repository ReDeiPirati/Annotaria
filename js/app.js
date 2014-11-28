var activeDoc = 1;
var usr = {};
var docs = 'http://annotaria.web.cs.unibo.it/documents/';
var nDocList = 0;
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
			$('.doc-area #documentTab li').first().addClass('active');
			$('.doc-area #documentTabContent div').first().addClass('active');
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

function openDoc() { 
	var title = $(this).attr("id");
	
	if ($(this).hasClass('active')) { //set the focus on the document
		$( '#' + title + '-tab').trigger("click");
	}
	else {
		$.ajax({
			method: 'GET',
			url:  docs + title + '.html',
			success: function(d) {
				$('#' + title).toggleClass('active');
				activeDoc ++;

				$('.doc-area #documentTab li.active').removeClass('active');
				$('.doc-area #documentTabContent div.active').removeClass('active');

				$('.doc-area #documentTab').append('<li role="presentation" class="active doc-tabs"><a href="#Doc-' + title +'" id="' + title +'-tab" role="tab" data-toggle="tab" aria-controls="Doc-' + title +'" aria-expanded="true"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&nbsp;&times;</button>' + title +'</a></li>');

				$('.doc-area #documentTabContent').append('<div role="tabpanel" class="tab-pane fade in active" id="Doc-' + title +'" aria-labelledBy="' + title +'-tab">');

				$('#Doc-' + title).html(d);
				/* aggiorno i link delle immagini */
				var imgs = $('#Doc-' + title + ' img');			
				for (var i=0; i<imgs.length; i++) {
					var src = $(imgs[i]).attr('src');
					$(imgs[i]).attr('src', docs + src);
				}

				$('#' + title + '-tab button.close').click(deleteTab);
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
*/

function titleAnnotator() {
	$('.navbar-brand').text("Annotaria");
	var htmlString =  '<span class="glyphicon glyphicon-pencil">&nbsp;</span>' + usr.name + ' ' + usr.surname; 
	htmlString += '&nbsp;<span class="caret"></span>';
	$('#mode').html( htmlString );
	toggleModeSelector();
}

/*
* titleReader
*
* modifica il navbar-brand e la scritta del mode
*/

function titleReader() {
	$('.navbar-brand').text("Leggotaria");
	var htmlString = $('#sel_reader').html();
	htmlString += '&nbsp;<span class="caret"></span>';
	$('#mode').html(htmlString);
	toggleModeSelector();
}


function setProvinence() {
	usr.name = $('#usr_name').val();
	usr.surname = $('#usr_surname').val();
	usr.email = $('#usr_email').val();
	$("#modal_provinence").modal("hide");
	titleAnnotator();	
}

function resetProvinence() {
	usr.name = "";
	$('#usr_name').val('');
	usr.surname = ""; 
	$('#usr_surname').val('');
	usr.email = "";
	$('#usr_email').val('');
	titleReader();	
}

/*
* searchDoc 
*
* cerca tutti i documenti nella doc list il cui nome inizia con il valore dell'input cerca
*/
function searchDoc() {
	var idDoc = $('#cerca input').val();
	$("#docList a:not(.found)").show();
	$('.found').removeClass('found');
	if (idDoc != "") {
		$("#docList a[id^='" + idDoc + "']").addClass('found'); 
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
			for (var i = 0; i < vet.length; i++) {
				var link = $(vet[i]).attr('href');
				if (link.indexOf(str, link.length - str.length) !== -1) { // controlla se il file e' .html
					var label = link.substr(0, link.length - str.length);
					$('#docList').append('<a id="' + label + '"  class="list-group-item" >' + label + '</a>');
					nDocList ++;
					$('#' + label).click(openDoc);
				}
			}
			$('#cerca input').on('change', searchDoc);
		},
		error: function(a,b,c) {
			alert('Error on load of the document');
		}
	});

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
	$('#submit_prominance').click(setProvinence);
	
	
	$('#sel_reader').click(resetProvinence);
	
	$('.doc-area #documentTab li a button.close').click(deleteTab);
});


