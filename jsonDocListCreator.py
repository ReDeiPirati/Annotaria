# jsonDocListCreator.py
# 	script per la creazione di un documento formato Jason contenente la lista dei documenti
#	presenti nella cartella passata come parametro.
#	Nel file Jason sono presenti due campi:
#	- il label, contenente il nome del documento
#	- la URL, con il path assoluto del documento
#
# @Authors: Federico Abrignani, Daniele Ferrari


import os, json, sys

jsonList = []


for docName in os.listdir(sys.argv[1]):
	docPath = "{0}/{1}".format(sys.argv[1], docName)

	if (os.path.isfile(docPath) and docName.endswith(".html")):
		jsonInfoChunk = {}

		doc = open(docPath,"r")
		docText = doc.read()

		title = ((docText.split("<title"))[1].split("</title>")[0]).split(">")[1]
		URL = os.path.abspath(docName)
		
		jsonInfoChunk["url"] = URL
		jsonInfoChunk["label"] = title
		
		doc.close()
		jsonList.append(jsonInfoChunk)
		
		
try:
	jsonFile = open("lamammadiLollosucchiai.json","w")
	json.dump(jsonList, jsonFile, indent=4, separators=(',', ': '))
	jsonFile.close()
	
except:
	print("cazzo\n")
	sys.exit(0)
