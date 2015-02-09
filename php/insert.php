
<?php
	
	require 'vendor/autoload.php';

	
	$message = array();	

	//the body response
        $data = array(

            "success"  => "true",
            "message"  => $message 
            
        );

try
{

	# poiche' non tutte le annotazione hanno come oggetto un URI, ma hanno un Literal, questa lista contiene i tipi di quelle il cui oggetto e' un URI
	$sonoUri = array('hasAuthor', 'hasPublisher', 'denotesPerson', 'denotesPlace', 'denotesDisease', 'hasSubject', 'relatesTo', 'cites' );
	

	$graph = new EasyRdf_Graph();	//creiamo un nuovo grafo


	$namespacelist = new EasyRdf_Namespace();

	$litanntype = new EasyRdf_Literal( $_POST["anntype"] );
	$litlabelann = new EasyRdf_Literal( $_POST["labelann"] );
	$litaoraann = new EasyRdf_Literal( $_POST["oraann"] );
	$litlabelstat = new EasyRdf_Literal( $_POST["labelstat"] );
	$litnomeann = new EasyRdf_Literal( $_POST["nomeann"] );
	$litemailann = new EasyRdf_Literal( $_POST["emailann"] );


	$doc = new EasyRdf_Resource( $_POST["doc"] );

	$uritarget = new EasyRdf_Resource( $_POST["target"] );

	$urisub = new EasyRdf_Resource( $_POST["subject"] );

	$pred = new EasyRdf_Resource( $_POST["predicate"] );

	$uriann = new EasyRdf_Resource( $_POST["uriann"] );
	
	


	//RDF namespaces
	$namespacelist -> set("RDFtype","http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
	$namespacelist -> set("RDFvalue","http://www.w3.org/1999/02/22-rdf-syntax-ns#value");
	$namespacelist -> set("RDFStatement","http://www.w3.org/1999/02/22-rdf-syntax-ns#Statement");
	$namespacelist -> set("RDFsubject","http://www.w3.org/1999/02/22-rdf-syntax-ns#subject");
	$namespacelist -> set("RDFpredicate","http://www.w3.org/1999/02/22-rdf-syntax-ns#predicate");
	$namespacelist -> set("RDFobject","http://www.w3.org/1999/02/22-rdf-syntax-ns#object");

	//OA namespaces

	$namespacelist -> set("OAAnnotation","http://www.w3.org/ns/oa#Annotation");
	$namespacelist -> set("OAhasTarget","http://www.w3.org/ns/oa#hasTarget");
	$namespacelist -> set("OASpecificResource","http://www.w3.org/ns/oa#SpecificResource");
	$namespacelist -> set("OAhasSource","http://www.w3.org/ns/oa#hasSource");
	$namespacelist -> set("OAhasSelector","http://www.w3.org/ns/oa#hasSelector");
	$namespacelist -> set("OAFragmentSelector","http://www.w3.org/ns/oa#FragmentSelector");
	$namespacelist -> set("OAAnnotation","http://www.w3.org/ns/oa#Annotation");
	$namespacelist -> set("OAstart","http://www.w3.org/ns/oa#start");
	$namespacelist -> set("OAend","http://www.w3.org/ns/oa#end");
	$namespacelist -> set("OAhasBody","http://www.w3.org/ns/oa#hasBody");
	$namespacelist -> set("OAannotedBy","http://www.w3.org/ns/oa#annotatedBy");
	$namespacelist -> set("OAannotedAt","http://www.w3.org/ns/oa#annotatedAt");

	//AO namespaces

	$namespacelist -> set("AOtype","http://vitali.web.cs.unibo.it/AnnOtaria/type");

	//RDFS namespaces

	$namespacelist -> set("RDFSLabel","http://www.w3.org/2000/01/rdf-schema#Label");

	//FOAF namespaces

	$namespacelist -> set("FOAFPerson","http://xmlns.com/foaf/0.1/Person");
	$namespacelist -> set("FOAFname","http://xmlns.com/foaf/0.1/name");

	//SCHEMA namespaces

	$namespacelist -> set("SCHEMAemail","http://schema.org/email");


	


	$annotation = $graph ->  newBNode();
	$nome = $graph ->  newBNode();
	$stat = $graph ->  newBNode();

	//annotation

	$OAAnn = new EasyRdf_Resource( $namespacelist -> get( "OAAnnotation" ) );

	$graph -> add( $annotation , $namespacelist -> get("RDFtype") ,  $OAAnn );	//http://www.w3.org/ns/oa#Annotation
	$graph -> add( $annotation , $namespacelist -> get("AOtype") ,  $litanntype );		//rdf.add((annotation,AO.type,Literal(args["anntype"].value))) 
	$graph -> add( $annotation , $namespacelist -> get("RDFSLabel") ,  $litlabelann );		//rdf.add((annotation,RDFS.label,Literal(args["labelann"].value)))

	array_push( $data['message'] , $_POST["target"] ); 

	if ( $_POST["target"] != "frammento" )
		$graph -> add( $annotation , $namespacelist -> get("OAhasTarget") , $uritarget  );	//rdf.add((annotation,OA.hasTarget,URIRef(args["target"].value))) !!!
	else
		{

			//fragment

			$litval = new EasyRdf_Literal( $_POST["val"] );
			$litstart = new EasyRdf_Literal( $_POST["start"] );
			$litend = new EasyRdf_Literal( $_POST["end"] );

			$doc = new EasyRdf_Resource( $_POST["doc"] );

			$tar = $graph ->  newBNode();
			$frag = $graph ->  newBNode();

			$graph -> add( $annotation , $namespacelist -> get("OAhasTarget") ,  $tar );	//rdf.add((annotation,OA.hasTarget,tar))

			$OASpe = new EasyRdf_Resource( $namespacelist -> get( "OASpecificResource" ) );
		
			$graph -> add( $tar , $namespacelist -> get("RDFtype") , $OASpe );	//rdf.add((tar,RDF.type,OA.SpecificResource))

			

			$graph -> add( $tar , $namespacelist -> get("OAhasSource") , $doc  );	//rdf.add((tar,OA.hasSource,URIRef(args["doc"].value))) !!!
			$graph -> add( $tar , $namespacelist -> get("OAhasSelector") ,  $frag );	//rdf.add((tar,OA.hasSelector,frag))

			$OAFrag = new EasyRdf_Resource( $namespacelist -> get( "OAFragmentSelector" ) );

			$graph -> add( $frag , $namespacelist -> get("RDFtype") ,  $OAFrag );	//rdf.add((frag,RDF.type,OA.FragmentSelector))
			$graph -> add( $frag , $namespacelist -> get("RDFvalue") , $litval );	//rdf.add((frag,RDF.value,Literal(args["val"].value)))
			$graph -> add( $frag , $namespacelist -> get("OAstart") ,  $litstart );	//rdf.add((frag,OA.start,Literal(args["start"].value)))
			$graph -> add( $frag , $namespacelist -> get("OAend") ,  $litend );	//rdf.add((frag,OA.end,Literal(args["end"].value)))
		}

	$graph -> add( $annotation , $namespacelist -> get("OAhasBody") , $stat  );	//rdf.add((annotation,OA.hasBody,stat))
	$graph -> add( $annotation , $namespacelist -> get("OAannotedBy") , $uriann );	//rdf.add((annotation,OA.annotatedBy,URIRef(args["uriann"].value)))
	$graph -> add( $annotation , $namespacelist -> get("OAannotedAt") , $litaoraann  );	//rdf.add((annotation,OA.annotatedAt,Literal(args["oraann"].value)))

	//statement


	$RDFSta = new EasyRdf_Resource( $namespacelist -> get( "RDFStatement" ) );

	$graph -> add( $stat , $namespacelist -> get("RDFtype") ,  $RDFSta  );	//rdf.add((stat,RDF.type,RDF.Statement))

	if ( array_key_exists( "labelstat" , $_POST ) )
			$graph -> add( $stat , $namespacelist -> get("RDFSLabel") ,  $litlabelstat  );	//rdf.add((stat,RDFS.label,Literal(args["labelstat"].value)))


	

	$graph -> add( $stat , $namespacelist -> get("RDFsubject") ,  $urisub  );	//rdf.add((stat,RDF.subject,URIRef(args["subject"].value)))

	

	$graph -> add( $stat , $namespacelist -> get("RDFpredicate") ,  $pred  );	//rdf.add((stat,RDF.predicate,URIRef(args["predicate"].value)))

	//is an annotation on a Uri or a literal
	if( in_array( $_POST["anntype"] , $sonoUri ) )
	{
		$uriobj = new EasyRdf_ParsedUri($_POST["object"]);	//rdf.add((stat,RDF.object,tipoObj(args["object"].value)))
		$graph -> add( $stat , $namespacelist -> get("RDFobject") ,  $uriobj  );
	}
	else
	{
		$litobj = new EasyRdf_Literal( $_POST["object"] );
		$graph -> add( $stat , $namespacelist -> get("RDFobject") ,  $litobj  );
	}


	//author

	$FOAFPerson = new EasyRdf_Resource( $namespacelist -> get( "FOAFPerson" ) );

	$graph -> add( $uriann , $namespacelist -> get("RDFtype") ,  $FOAFPerson  );//rdf.add((URIRef(args["uriann"].value),RDF.type,FOAF.Person))
	$graph -> add( $uriann , $namespacelist -> get("FOAFname") ,  $litnomeann  );//rdf.add((URIRef(args["uriann"].value),FOAF.name,Literal(args["nomeann"].value)))
	$graph -> add( $uriann , $namespacelist -> get("SCHEMAemail") ,  $litemailann  );//rdf.add((URIRef(args["uriann"].value),SCHEMA.email,Literal(args["emailann"].value)))

	
	//load the graph in the triplestore

	$triplestore_url = $_POST["endpoint"];

	array_push( $data['message'] , $triplestore_url  ); 

	$spqcli = new EasyRdf_Sparql_Client( $triplestore_url . "/query" , $triplestore_url . "/update" );

	$insert = $graph -> serialise( "ntriples" );

	$toinsert = sprintf( "INSERT DATA { %s }" , $insert );

	$spqcli -> update( $toinsert );

	array_push( $data['message'] , $toinsert  ); 

	array_push( $data['message'] , "hai inserito correttamente le annotazioni"  ); 

}


catch( Exception $e )
{
	$data["success"] = "false";
	array_push( $data['message'] ,  $e -> getMessage() ); 
}

	//response as a json
	header('Content-type: application/json');

        echo json_encode($data);

	
	
?>
	


