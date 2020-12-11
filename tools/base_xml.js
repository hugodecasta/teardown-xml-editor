module.exports = (data_xml) => ([
    {
        _name: 'scene',
        _attrs: {
            version: 3,
            shadowVolume: "200 100 200"
        },
        _content: [
            {
                _name: 'environment',
                _attrs: {
                    template: "sunset"
                }
            },
            {
                _name: 'body',
                _content: [
                    {
                        _name: "voxbox",
                        _attrs: {
                            pos: "-100.0 -0.1 -100.0",
                            size: "2000 1 2000"
                        }
                    }
                ]
            },
            {
                _name: 'body',
                _content: data_xml
            },
            {
                _name: 'boundary',
                _content: [
                    { _name: 'vertex', _attrs: { pos: '-100.0 -100.0' } },
                    { _name: 'vertex', _attrs: { pos: '100.0 -100.0' } },
                    { _name: 'vertex', _attrs: { pos: '100.0 100.0' } },
                    { _name: 'vertex', _attrs: { pos: '-100.0 100.0' } }
                ]
            },
            {
                _name: 'script',
                _attrs: {
                    file: "../../data/script/main.lua"
                }
            }
        ],
    }
])