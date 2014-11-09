
import os, json, sys
jsonInfo = {}

for docName in os.listdir(sys.argv[1]):
	docPath = "{0}/{1}".format(sys.argv[1], docName)

	if os.path.isfile(docPath):
		doc = open(docPath,"r")
		docText = doc.read()

		title = ((docText.split("<title"))[1].split("</title>")[0]).split(">")[1]

		URL = os.path.abspath(docName)
		jsonInfo[title] = URL

		doc.close()

try:
	jsonFile = open("lamammadiLollosucchiai.json","w")
	json.dump(jsonInfo, jsonFile, indent=4, separators=(',', ': '))
	jsonFile.close()
	
except:
	print("cazzo\n")
	sys.exit(0)
