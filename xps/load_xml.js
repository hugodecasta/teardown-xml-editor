const fs = require('fs')
var convert = require('xml-js');


let xml = fs.readFileSync("G:\\steam_content\\steamapps\\common\\Teardown\\create\\custom.xml", 'utf8')

function parse_node(node) {
    return {
        _name: node.name,
        _attrs: node.attributes,
        _content: (node.elements ?? []).map(node => parse_node(node))
    }
}
var json = JSON.parse(convert.xml2json(xml, { compact: false }))
console.log(parse_node(json.elements[0]))