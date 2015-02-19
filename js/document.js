/*
* loadDocList
*
* carica i documenti dal link docs e li inserisce in una lista nell'area laterale
* inizializza la funzione di ricerca documenti
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

/*
* openDoc
*
* apre il documento selezionato nell'area centrale.
* carica le annotazioni sul documento e sul frammento.
* se e' il primo documento che viene aperto nasconde l'introduzione e poi abilita il pulsante per eseguire annotazioni e i filtri
* title e' il titolo del documento da aprire
* itemId e' una stringa per identificare il documento
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

				$('.doc-area #documentTab').append('<li role="presentation" class="active doc-tabs"><a href="#Doc-' + itemId +'" id="' + itemId +'-tab" role="tab" data-toggle="tab" aria-controls="Doc-' + itemId +'" aria-expanded="true" onclick="$(\'#MetaTab-' + itemId + '\').trigger(\'click\');"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&nbsp;&times;</button>' + title +'</a></li>');

				$('.doc-area #documentTabContent').append('<div role="tabpanel" class="tab-pane fade in active docStyle" id="Doc-' + itemId +'" aria-labelledBy="' + itemId +'-tab">');
				
				$('#Doc-' + itemId).html(d);
				
				/* aggiorno i link delle immagini */
				var imgs = $('#Doc-' + itemId + ' img');			
				for (var i=0; i<imgs.length; i++) {
					var src = $(imgs[i]).attr('src');
					$(imgs[i]).attr('src', docs + src);
				}

				$('#' + itemId + '-tab button.close').click(deleteTab);
				checkTab();
				
				$('#metaTab li.active').removeClass('active');
				$('#documentAnnotation div.active').removeClass('active');
				
				$('#metaTab').append('<li role="presentation" class="active doc-tabs"><a href="#Meta-' + itemId +'" id="MetaTab-' + itemId + '" role="tab" data-toggle="tab" aria-controls="Meta-' + itemId +'" aria-expanded="true"></a></li>');
				$('#documentAnnotation').append('<div role="tabpanel" class="tab-pane fade in active" id="Meta-' + itemId +'" aria-labelledBy="MetaTab-' + itemId + '"><div class="list-group"></div></div>');
				
				//chiamata per chiedere tutte le annotazioni sull'intero documento
				caricaAnnDoc();


				//query per chiedere tutte le annotazioni su frammento relative al documento in questione
				query('SELECT ?a ?tp ?lb ?id ?st ?en ?nm ?ml ?dt ?val ?v1 ?v2 ?v3 WHERE { ?a a oa:Annotation ; oa:hasTarget ?t ;  oa:annotatedBy ?aut ; oa:annotatedAt ?dt ; oa:hasBody ?b . ?t a oa:SpecificResource. ?t oa:hasSource <'+dpref['ao'] + title + '.html' + '>. ?t oa:hasSelector ?s . ?s a oa:FragmentSelector ; oa:end ?en ; oa:start ?st ; rdf:value ?id . ?aut foaf:name ?nm ; schema:email ?ml . ?b rdf:object ?val . OPTIONAL { ?a rdfs:label ?lb . } OPTIONAL { ?a ao:type ?tp . } OPTIONAL { ?val foaf:name ?v1 . } OPTIONAL { ?val rdfs:label ?v2 . } OPTIONAL { ?b rdfs:label ?v3 . } }', caricaAnn, undefined, undefined, function () {alert("Impossibile caricare le annotazioni, il triple store non \u00E8 raggiungibile")},defTimeout);
				

				
				if(!openfirst) {
					openfirst = true;
					$('#Doc1-tab button.close').trigger('click');
					$('#annote-nav-button').parent().removeClass('disabled');
					$('#filter input[type="checkbox"]').prop("disabled","");
				}


			},
			error: function(a,b,c) {
				alert('Error on load ' + docs + title + '.html');
			}
		});
	}
}

/*
* caricaAnnDoc
* 
* funzione che esegue una query per ogni tipo di annotazione sul documento
*/
function caricaAnnDoc() {	
	
	var doc = $('.active.doc-tabs a').text() + '.html';
	doc = doc.substr(2);
	
	$.when( 
		query('select ?txt ?nm ?ml ?dt where { ?ann a oa:Annotation ; oa:hasTarget <'+dpref['ao']+doc+'> ; oa:hasBody ?b ; oa:annotatedBy ?aut ; oa:annotatedAt ?dt . ?aut schema:email ?ml ; foaf:name ?nm . ?b rdf:predicate dcterms:creator ; rdf:object ?cr . ?cr a foaf:Person ; foaf:name ?txt . } order by ?dt ', getAnnDoc, 'hasAuthor', undefined, undefined, defTimeout ),
		query('select ?txt ?nm ?ml ?dt where { ?ann a oa:Annotation ; oa:hasTarget <'+dpref['ao']+doc+'> ; oa:hasBody ?b ; oa:annotatedBy ?aut ; oa:annotatedAt ?dt . ?aut schema:email ?ml ; foaf:name ?nm . ?b rdf:predicate dcterms:publisher; rdf:object ?p . ?p a foaf:Organization ; foaf:name ?txt . } order by ?dt ', getAnnDoc, 'hasPublisher', undefined, undefined, defTimeout ),
		query('select ?txt ?nm ?ml ?dt where { ?ann a oa:Annotation ; oa:hasTarget <'+dpref['ao']+doc+'> ; oa:hasBody ?b ; oa:annotatedBy ?aut ; oa:annotatedAt ?dt . ?aut schema:email ?ml ; foaf:name ?nm . ?b rdf:predicate fabio:hasPublicationYear ; rdf:object ?txt .  } order by ?dt ', getAnnDoc, 'hasPublicationYear', undefined, undefined, defTimeout ),
		query('select ?txt ?nm ?ml ?dt where { ?ann a oa:Annotation ; oa:hasTarget <'+dpref['ao']+doc+'> ; oa:hasBody ?b ; oa:annotatedBy ?aut ; oa:annotatedAt ?dt . ?aut schema:email ?ml ; foaf:name ?nm . ?b rdf:predicate dcterms:title ; rdf:object ?txt .  } order by ?dt ', getAnnDoc, 'hasTitle', undefined, undefined, defTimeout ),
		query('select ?txt ?nm ?ml ?dt where { ?ann a oa:Annotation ; oa:hasTarget <'+dpref['ao']+doc+'> ; oa:hasBody ?b ; oa:annotatedBy ?aut ; oa:annotatedAt ?dt . ?aut schema:email ?ml ; foaf:name ?nm . ?b rdf:predicate dcterms:abstract; rdf:object ?txt .  } order by ?dt ', getAnnDoc, 'hasAbstract', undefined, undefined, defTimeout ),
		query('select ?txt ?nm ?ml ?dt where { ?ann a oa:Annotation ; oa:hasTarget <'+dpref['ao']+doc+'> ; oa:hasBody ?b ; oa:annotatedBy ?aut ; oa:annotatedAt ?dt . ?aut schema:email ?ml ; foaf:name ?nm . ?b rdf:predicate fabio:hasShortTitle; rdf:object ?txt .  } order by ?dt ', getAnnDoc, 'hasShortTitle', undefined, undefined, defTimeout ),
		query('select ?txt ?nm ?ml ?dt where { ?ann a oa:Annotation ; oa:hasTarget <'+dpref['ao']+doc+'> ; oa:hasBody ?b ; oa:annotatedBy ?aut ; oa:annotatedAt ?dt . ?aut schema:email ?ml ; foaf:name ?nm . ?b rdf:predicate schema:comment ; rdf:object ?txt .  } order by ?dt ', getAnnDoc, 'hasComment', undefined, undefined, defTimeout )
	);
}