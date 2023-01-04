import plugin from '../plugin.json';
import tag from 'html-tag-js';
import style from './style.scss';

const less = require('less');
const { fsOperation } = acode;

class AcodePlugin {

    async init($page) {
        $page.id = "acode-plugin-lesscss";
        $page.settitle("Less Compiler(Error)");
        this.$page = $page;
        this.$logsArea = tag('pre',{
            className: "logArea",
        });
        this.$page.append(this.$logsArea);
        editorManager.on('save-file', this.compile.bind(this));
        this.$page.onhide = () =>{
            this.$logsArea.innerText = "";
        }
        this.$style = tag('style',{
            textContent: style,
        });
        document.head.append(this.$style);
    }
    
    async compile(file){
        const {location, name, session } = file;
        if (!location || !/\.(less)$/.test(name)) return;
        const cssname = name.replace(/less$/, 'css');
        const cssfs = await fsOperation(`${location}/${cssname}`);
        this.compileLess(session.getValue(), async (error, css) => {
            if (error) {
                this.$logsArea.innerText = error;
                this.$page.show();
            } else {
                await this.writeCss(location,cssname,cssfs,css);
                window.toast('Compiled',4000);
            }
        });
    }
    
    async writeCss(location,cssname,cssfs,css) {
        if(!(await cssfs.exists())){
            await fsOperation(location).createFile(cssname,css);
        }else{
            await cssfs.writeFile(css);
        }
    }
    
    compileLess(lessFile, callback) {
        try {
            less.render(lessFile, function(error, output) {
                if (error) {
                    callback(error);
                } else {
                    callback(null, output.css);
                }
            });
        } catch (error) {
            callback(error);
        }
    }


    
    async destroy() {
        editorManager.off('save-file', this.compile);
    }
}

if (window.acode) {
    const acodePlugin = new AcodePlugin();
    acode.setPluginInit(plugin.id, (baseUrl, $page, {
        cacheFileUrl, cacheFile
    }) => {
        if (!baseUrl.endsWith('/')) {
            baseUrl += '/';
        }
        acodePlugin.baseUrl = baseUrl;
        acodePlugin.init($page, cacheFile, cacheFileUrl);
    });
    acode.setPluginUnmount(plugin.id, () => {
        acodePlugin.destroy();
    });
}