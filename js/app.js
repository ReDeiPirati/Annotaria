var numDoc = 1;
var activeDoc = 1;
var usr = {};
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
*/
function deleteTab() {
	var tabId = $(this).parent().attr("href");
	$(tabId).remove();
	$(this).parent().parent().remove();
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
*/

function addTab() { 
	numDoc ++;
	activeDoc ++;
	
	
	$('.doc-area #documentTab li.active').removeClass('active');
	$('.doc-area #documentTabContent div.active').removeClass('active');
	
	$('.doc-area #documentTab').append('<li role="presentation" class="active"><a href="#Doc' + numDoc +'" id="Doc' + numDoc +'-tab" role="tab" data-toggle="tab" aria-controls="Doc' + numDoc +'" aria-expanded="true">Doc' + numDoc +'&nbsp;<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button></a></li>');
	
	$('.doc-area #documentTabContent').append('<div role="tabpanel" class="tab-pane fade in active" id="Doc' + numDoc +'" aria-labelledBy="Doc' + numDoc +'-tab"><p class="text-justify"> Content tab numero ' + numDoc +'. Al momento sono attivi ' + activeDoc +' content tab.</p></div>');
	
	$('#Doc' + numDoc + '-tab button.close').click(deleteTab);
	checkTab();
}

function toggle_mode_selector () {
	$('#sel_annotator').toggle();
	$('#sel_reader').toggle();
}

/*
* title_annotator
*
* modifica il navbar-brand e la scritta del mode
*/

function title_annotator() {
	$('.navbar-brand').text("Annotaria");
	var htmlString =  '<span class="glyphicon glyphicon-pencil">&nbsp;</span>' + usr.name + ' ' + usr.surname; 
	htmlString += '&nbsp;<span class="caret"></span>';
	$('#mode').html( htmlString );
	toggle_mode_selector();
}

/*
* title_reader
*
* modifica il navbar-brand e la scritta del mode
*/

function title_reader() {
	$('.navbar-brand').text("Leggotaria");
	var htmlString = $('#sel_reader').html();
	htmlString += '&nbsp;<span class="caret"></span>';
	$('#mode').html(htmlString);
	toggle_mode_selector();
}


function set_provinence() {
	usr.name = $('#usr_name').val();
	usr.surname = $('#usr_surname').val();
	usr.email = $('#usr_email').val();
	$("#modal_provinence").modal("hide");
	title_annotator();	
}

function reset_provinence() {
	usr.name = "";
	$('#usr_name').val('');
	usr.surname = ""; 
	$('#usr_surname').val('');
	usr.email = "";
	$('#usr_email').val('');
	title_reader();	
}

/*
* docs_search 
*
* cerca tutti i documenti nella doc list il cui nome inizia con il valore dell'input cerca
*/
function docs_search() {
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
* doc_list_load
*
* carica i documenti dal lind docs e li inserisce in una tabella
* se i documenti sono piu' di 10 mostra i pulsanti per lo switch di pagina
*
*/
function doc_list_load() {
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
				}
			}
			$('#cerca input').on('change', docs_search);
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
}



$(document).ready(function () {
	
	doc_list_load();
	
	$('#sel_reader').toggle();
	$('#submit_prominance').click(set_provinence);
	
	
	$('#sel_reader').click(reset_provinence);
	
	$('.doc-area #documentTab li a button.close').click(deleteTab);
});


