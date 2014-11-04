var numDoc = 1;
var activeDoc = 1;

/*
* checkTab
*
* se le tab esistenti sono meno di 2 nasconde i tab, al contrario li mostra
*/
function checkTab () {
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
	
	$('.doc-area #documentTab').append('<li role="presentation" class="active"><a href="#Doc' + numDoc +'" id="Doc' + numDoc +'-tab" role="tab" data-toggle="tab" aria-controls="Doc' + numDoc +'" aria-expanded="true">Doc' + numDoc +'&nbsp;<span class="glyphicon glyphicon-remove"></span></a></li>');
	
	$('.doc-area #documentTabContent').append('<div role="tabpanel" class="tab-pane fade in active" id="Doc' + numDoc +'" aria-labelledBy="Doc' + numDoc +'-tab"><p class="text-justify"> Content tab numero ' + numDoc +'. Al momento sono attivi ' + activeDoc +' content tab.</p></div>');
	
	$('#Doc' + numDoc + '-tab span.glyphicon-remove').click(deleteTab);
	checkTab();
}


$( document ).ready(function() {
		
	$('#sel-annotator').click(function () {
		$('.navbar-brand').text("Annotaria");
		var htmlString = $( this ).html();
		htmlString += '&nbsp;<span class="caret"></span>';
		$('#mode').html( htmlString );
	});
	
	$('#sel-reader').click(function () {
		$('.navbar-brand').text("Leggotaria");
		var htmlString = $( this ).html();
		htmlString += '&nbsp;<span class="caret"></span>';
		$('#mode').html( htmlString );
	});
	
	$('.doc-area #documentTab li a span.glyphicon-remove').click(deleteTab);	
	
	$('.sidebar #siderTabContent span.glyphicon-tower').click(addTab);
});


