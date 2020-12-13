module.exports = (data_xml) => ([
    {
        _name: 'scene',
        _attrs: {
            version: 3,
            shadowVolume: "200 100 200"
        },
        _content: [
            ...data_xml,
            {
                _name: 'script',
                _attrs: {
                    file: "../../data/script/main.lua"
                }
            }
        ],
    }
])