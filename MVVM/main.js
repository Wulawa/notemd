function node2Fragment(node, vm){
	const dom = document.createDocumentFragment();
	let child;
	while(child = node.firstChild){
		compile(child, vm);
		dom.append(child);
	}
	return dom;
}
function compile(node, vm){
	// dom
	if(node.nodeType === 1){
		const attrs = node.attributes;
		Array.from(attrs).forEach((attr) => {
			if(attr.nodeName === 'v-model'){
				const key = attr.nodeValue;
				node.value = vm.data[key];
				node.addEventListener('input',(e) => {
					vm.data[key] = e.target.value;
				})
			}
		})
	}
	// text
	if(node.nodeType === 3){
		const reg = /\{\{(.*)\}\}/;
		if(reg.test(node.nodeValue)){
			const key = RegExp.$1;
			// node.nodeValue = vm.data[key];
			new watcher(key, vm ,node);
		}
	}
}
function fineReactive(data, key, value){
	observe(value);
	const dep = new Dep();
	Object.defineProperty(data, key, {
		get(){
			Dep.target && dep.addSub(Dep.target);
			return value;
		},
		set(newVal){
			value = newVal;
			console.log(value);
			dep.notify();
		},
	})
}
function observe(data){
	if(typeof data !== 'object') return;
	Object.keys(data).forEach((key) => {
		fineReactive(data,key,data[key])
	})
}
function watcher(name ,vm, node){
	Dep.target = this;
	this.name = name;
	this.node = node;
	this.vm = vm;
	this.updata();
	Dep.target = null;
}
watcher.prototype = {
	updata(){
		this.node.nodeValue = this.vm.data[this.name]
	}
}
function Dep(){
	this.dep = [];
}
Dep.prototype = {
	addSub(sub){
		this.dep.push(sub);
	},
	notify(){
		this.dep.forEach((sub) => {
			sub.updata();
		})
	}
}
function Vue(option){
	this.data = option.data
	observe(this.data);
	const id = option.el;
	const fragment = node2Fragment(document.getElementById(id), this);
	document.getElementById(id).appendChild(fragment);
}

const vm = new Vue({
	el:'app',
	data:{
		text:'hello world',
	}
})