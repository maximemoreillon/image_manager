(function(e){function t(t){for(var n,r,s=t[0],c=t[1],l=t[2],m=0,p=[];m<s.length;m++)r=s[m],Object.prototype.hasOwnProperty.call(o,r)&&o[r]&&p.push(o[r][0]),o[r]=0;for(n in c)Object.prototype.hasOwnProperty.call(c,n)&&(e[n]=c[n]);u&&u(t);while(p.length)p.shift()();return i.push.apply(i,l||[]),a()}function a(){for(var e,t=0;t<i.length;t++){for(var a=i[t],n=!0,s=1;s<a.length;s++){var c=a[s];0!==o[c]&&(n=!1)}n&&(i.splice(t--,1),e=r(r.s=a[0]))}return e}var n={},o={app:0},i=[];function r(t){if(n[t])return n[t].exports;var a=n[t]={i:t,l:!1,exports:{}};return e[t].call(a.exports,a,a.exports,r),a.l=!0,a.exports}r.m=e,r.c=n,r.d=function(e,t,a){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:a})},r.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"===typeof e&&e&&e.__esModule)return e;var a=Object.create(null);if(r.r(a),Object.defineProperty(a,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var n in e)r.d(a,n,function(t){return e[t]}.bind(null,n));return a},r.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="/";var s=window["webpackJsonp"]=window["webpackJsonp"]||[],c=s.push.bind(s);s.push=t,s=s.slice();for(var l=0;l<s.length;l++)t(s[l]);var u=c;i.push([0,"chunk-vendors"]),a()})({0:function(e,t,a){e.exports=a("56d7")},"0ca7":function(e,t,a){"use strict";var n=a("8829"),o=a.n(n);o.a},"2c0c":function(e,t,a){"use strict";var n=a("e86e"),o=a.n(n);o.a},"56d7":function(e,t,a){"use strict";a.r(t);a("e260"),a("e6cf"),a("cca6"),a("a79d");var n=a("2b0e"),o=function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("div",{attrs:{id:"app"}},[a("AppTemplate",{attrs:{applicationName:"Image manager"},scopedSlots:e._u([{key:"navigation",fn:function(){return[a("router-link",{attrs:{to:"/"}},[a("upload-icon"),a("span",[e._v("Upload")])],1),a("router-link",{attrs:{to:"/uploads"}},[a("format-list-bulleted-icon"),a("span",[e._v("Upload list")])],1)]},proxy:!0}])})],1)},i=[],r=a("573d"),s=a("ba3a"),c=a("0148"),l={name:"app",components:{AppTemplate:r["a"],UploadIcon:s["a"],FormatListBulletedIcon:c["a"]},data:function(){return{}}},u=l,m=a("2877"),p=Object(m["a"])(u,o,i,!1,null,null,null),d=p.exports,f=a("8c4f"),_=function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("div",{staticClass:"home"},[a("form",{on:{submit:function(t){return t.preventDefault(),e.submit()}}},[a("input",{ref:"image_input",attrs:{type:"file",name:"image"}}),a("input",{attrs:{type:"submit",name:""}})])])},h=[],g={name:"Home",components:{},data:function(){return{}},methods:{submit:function(){var e=this,t=new FormData;t.append("image",this.$refs.image_input.files[0]),this.axios.post("".concat("https://img.maximemoreillon.com","/upload"),t,{headers:{"Content-Type":"multipart/form-data"}}).then((function(t){e.$router.push({name:"view_upload",query:{id:t.data._id}})})).catch((function(e){return console.log(e)}))}}},v=g,b=(a("0ca7"),Object(m["a"])(v,_,h,!1,null,null,null)),y=b.exports,w=function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("div",{staticClass:"uploads_list"},[a("div",{staticClass:"uploads_wrapper"},e._l(e.images,(function(t,n){return a("UploadPreview",{key:t._id,attrs:{image:t},on:{image_deleted:function(t){return e.remove_image(n)}}})})),1),e.loaded_all?e._e():a("div",{staticClass:"load_more_button_wrapper"},[a("button",{attrs:{type:"button"},on:{click:function(t){return e.get_images()}}},[e._v("Load more")])])])},x=[],C=(a("4160"),a("a434"),a("159b"),function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("div",{staticClass:"image_preview",on:{click:function(t){return e.$router.push({name:"view_upload",query:{id:e.image._id}})}}},[a("div",{staticClass:"image_wrapper"},[a("img",{attrs:{src:e.image_url}})]),a("div",{staticClass:"metadata_wrapper"},[a("div",{staticClass:"size_wrapper"},[e._v(" Size: "+e._s(e.image.size/1e3)+"kB ")]),a("div",{staticClass:"size_wrapper"},[e._v(" Referers: "+e._s(e.image.referers.length)+" ")])])])}),j=[],O=(a("99af"),{name:"ImageInfo",props:{image:Object},components:{},methods:{copy_url:function(){var e=this.$refs.image_url;e.select(),e.setSelectionRange(0,99999),document.execCommand("copy")}},computed:{image_url:function(){return"".concat("https://img.maximemoreillon.com","/").concat(this.image.path)}}}),k=O,$=(a("abce"),Object(m["a"])(k,C,j,!1,null,"91a4d058",null)),S=$.exports,P={name:"List",data:function(){return{images:[],loaded_all:!1,load_count:20}},components:{UploadPreview:S},mounted:function(){this.delete_all_images(),this.get_images()},methods:{delete_all_images:function(){this.images.splice(0,this.images.length),this.loaded_all=!1},get_images:function(){var e=this;this.axios.post("".concat("https://img.maximemoreillon.com","/list"),{start_index:this.images.length,load_count:this.load_count}).then((function(t){t.data.forEach((function(t){e.images.push(t)})),t.data.length<e.load_count&&(e.loaded_all=!0)})).catch((function(e){return console.log(e)}))},remove_image:function(e){this.images.splice(e,1)},drop:function(){var e=this;confirm("Really?")&&this.axios.post("".concat("https://img.maximemoreillon.com","/drop")).then((function(){e.get_images()})).catch((function(e){return console.log(e)}))}}},z=P,U=(a("2c0c"),Object(m["a"])(z,w,x,!1,null,"c5be200e",null)),E=U.exports,I=function(){var e=this,t=e.$createElement,a=e._self._c||t;return a("div",{staticClass:"upload_details"},[e.image?[a("div",{staticClass:"image_Wrapper"},[a("a",{attrs:{href:e.image_url}},[a("img",{attrs:{src:e.image_url}})])]),a("div",{staticClass:"table_wrapper"},[a("table",[a("tr",[a("td",[e._v("Size")]),a("td",[e._v(e._s(e.image.size/1e3)+" kB")])]),a("tr",[a("td",[e._v("Upload date")]),a("td",[e._v(e._s(e.image.upload_date))])]),a("tr",[a("td",[e._v("Copy URL")]),a("td",[a("input",{ref:"image_url",staticClass:"url_input",attrs:{type:"text",readonly:""},domProps:{value:e.image_url}}),a("content-copy-icon",{on:{click:function(t){return e.copy_url()}}})],1)]),a("tr",[a("td",[e._v("Delete")]),a("td",[a("delete-icon",{on:{click:function(t){return e.delete_image()}}})],1)])])]),a("div",{staticClass:"table_wrapper"},[a("table",{staticClass:"referers_table"},[a("tr",[a("th",[e._v("Referers: "+e._s(e.image.referers.length))])]),e._l(e.image.referers,(function(t){return a("tr",{key:t.url},[a("td",[a("a",{attrs:{href:t.url}},[e._v(e._s(t.url))])])])}))],2)])]:e._e()],2)},R=[],T=a("0647"),q=a("3c43"),A={name:"ViewUpload",data:function(){return{image:null}},components:{ContentCopyIcon:q["a"],DeleteIcon:T["a"]},mounted:function(){this.get_upload()},methods:{get_upload:function(){var e=this;this.$route.query.id&&(this.image=null,this.axios.post("".concat("https://img.maximemoreillon.com","/image_details"),{id:this.$route.query.id}).then((function(t){e.image=t.data})).catch((function(e){return console.log(e)})))},delete_image:function(){var e=this;confirm("Really?")&&this.axios.post("".concat("https://img.maximemoreillon.com","/delete"),{id:this.image._id}).then((function(){e.$router.push({name:"list"})})).catch((function(e){return console.log(e)}))},copy_url:function(){var e=this,t=this.$refs.image_url;t.select(),t.setSelectionRange(0,99999),document.execCommand("copy"),setTimeout((function(){e.url_copied=!1}),3e3)}},computed:{image_url:function(){return"".concat("https://img.maximemoreillon.com","/image?id=").concat(this.image._id)}}},B=A,D=(a("a22b"),Object(m["a"])(B,I,R,!1,null,"777e40d6",null)),L=D.exports;n["a"].use(f["a"]);var M=[{path:"/",name:"upload",component:y},{path:"/uploads",name:"list",component:E},{path:"/view_upload",name:"view_upload",component:L}],F=new f["a"]({mode:"history",base:"/",routes:M}),J=F,H=a("2f62");n["a"].use(H["a"]);var N=new H["a"].Store({state:{},mutations:{},actions:{},modules:{}}),V=a("bc3a"),W=a.n(V),G=a("a7fe"),K=a.n(G),Q=a("2b27"),X=a.n(Q);n["a"].use(X.a),n["a"].use(K.a,W.a),J.beforeEach((function(e,t,a){n["a"].$cookies.get("jwt")?(W.a.defaults.headers.common["Authorization"]="Bearer ".concat(n["a"].$cookies.get("jwt")),a()):(delete W.a.defaults.headers.common["Authorization"],window.location.href="https://authentication.maximemoreillon.com/")})),n["a"].config.productionTip=!1,new n["a"]({router:J,store:N,render:function(e){return e(d)}}).$mount("#app")},8829:function(e,t,a){},"884b":function(e,t,a){},a22b:function(e,t,a){"use strict";var n=a("884b"),o=a.n(n);o.a},abce:function(e,t,a){"use strict";var n=a("d376"),o=a.n(n);o.a},d376:function(e,t,a){},e86e:function(e,t,a){}});
//# sourceMappingURL=app.1ffaeed7.js.map