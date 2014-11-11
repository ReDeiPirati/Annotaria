var numDoc = 1;
var activeDoc = 1;
var usr = {};
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

/*
* title_annotator
*
* modifica il navbar-brand e la scritta del mode
*/

function title_annotator() {
	$('.navbar-brand').text("Annotaria");
	var htmlString = $('#sel-annotator').html();
	htmlString += '&nbsp;<span class="caret"></span>';
	$('#mode').html( htmlString );
}

/*
* title_reader
*
* modifica il navbar-brand e la scritta del mode
*/

function title_reader() {
	$('.navbar-brand').text("Leggotaria");
	var htmlString = $('#sel-reader').html();
	htmlString += '&nbsp;<span class="caret"></span>';
	$('#mode').html(htmlString);
}


function set_provinence() {
	alert("entra nella funzione");
	usr.name = $('#usr_name').val();
	usr.surname = $('#usr_surname').val();
	usr.email = $('#usr_email').val();
	title_annotator();
	$("#modal_provinence").modal('hide');
	alert("esce dalla funzione");
	
}

$(document).ready(function () {
	$('#submit_prominance').click(set_prominance);
	//$('#sel-annotator').click(title_annotator);
	
	$('#sel-reader').click(title_reader);
	
	$('.doc-area #documentTab li a button.close').click(deleteTab);
	
	$('.sidebar #siderTabContent span.glyphicon-tower').click(addTab);
});


