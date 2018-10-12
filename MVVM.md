# 剖析Vue原理&实现双向绑定MVVM

#### 几种实现双向绑定的做法

> 发布者-订阅者模式（backbone.js）

> 脏值检查（angular.js）

> 数据劫持（vue.js）

`发布者-订阅者模式`: 一般通过sub, pub的方式实现数据和视图的绑定监听，更新数据方式通常做法是 vm.set('property', value)，这里有篇文章讲的比较详细

`脏值检查`: angular.js 是通过脏值检测的方式比对数据是否有变更，来决定是否更新视图，最简单的方式就是通过 setInterval() 定时轮询检测数据变动，当然Google不会这么low，angular只有在指定的事件触发时进入脏值检测，大致如下：

> DOM事件，譬如用户输入文本，点击按钮等。( ng-click )
> 
> XHR响应事件 ( $http )
> 
> 浏览器Location变更事件 ( $location )
> 
> Timer事件( $timeout , $interval )
> 
> 执行 $digest() 或 $apply()

`数据劫持`: vue.js 则是采用数据劫持结合发布者-订阅者模式的方式，通过Object.defineProperty()来劫持各个属性的setter，getter，在数据变动时发布消息给订阅者，触发相应的监听回调。


#### 思路整理
已经了解到vue是通过数据劫持的方式来做数据绑定的，其中最核心的方法便是通过Object.defineProperty()来实现对属性的劫持，达到监听数据变动的目的，无疑这个方法是本文中最重要、最基础的内容之一，如果不熟悉defineProperty，猛戳这里
整理了一下，要实现mvvm的双向绑定，就必须要实现以下几点：

> 1、实现一个数据监听器Observer，能够对数据对象的所有属性进行监听，如有变动可拿到最新值并通知订阅者

> 2、实现一个指令解析器Compile，对每个元素节点的指令进行扫描和解析，根据指令模板替换数据，以及绑定相应的更新函数

> 3、实现一个Watcher，作为连接Observer和Compile的桥梁，能够订阅并收到每个属性变动的通知，执行指令绑定的相应回调函数，从而更新视图

> 4、mvvm入口函数，整合以上三者


<img src='https://segmentfault.com/img/bVBQYu'>
#### 一、访问器属性
访问器属性是对象中的一种特殊属性，它不能直接在对象中设置，而必须通过 defineProperty() 方法单独定义。
```javascript
const obj = {
    hello:'world'
};
Object.defineProperty(obj, 'hello', {
	get(){
		console.log('get');
		return this.world;
	},
	set(val){
		console.log('set');
		this.world = val;
	}
})
obj.hello; //get
obj.hello = 'abc'; //set
```

#### 二、极简双向绑定的实现
```javascript
const obj = {};

Object.defineProperty(obj, 'hello', {
    set(newVal){
		document.getElementById('a').val = newVal;
		document.getElementById('b').innerHTML = newVal;
	}
})

document.addEventListener('keyup', (e) => {
	obj.hello = e.target.value
})
```
#### 四、DocumentFragment
DocumentFragment（文档片段）可以看作节点容器，它可以包含多个子节点，当我们将它插入到 DOM 中时，只有它的子节点会插入目标节点，所以把它看作一组节点的容器。使用 DocumentFragment 处理节点，速度和性能远远优于直接操作 DOM。Vue 进行编译时，就是将挂载目标的所有子节点劫持（真的是劫持，通过 append 方法，DOM 中的节点会被自动删除）到 DocumentFragment 中，经过一番处理后，再将 DocumentFragment 整体返回插入挂载目标。

```javascript
const dom = node2Fragment(document.getElementById('app'));
console.log(dom);

function node2Fragement(node){
    const flag = document.createDocumentFragment();
	const child ;
	while(child = node.fristChild){
		flag.append(child);
	}
	return flag;
}

document.getElementById('app').appendChild(dom);
```
#### 五、实现compile
`compile`主要做的事情是解析模板指令，将模板中的变量替换成数据，然后初始化渲染页面视图，并将每个指令对应的节点绑定更新函数，添加监听数据的订阅者，一旦数据有变动，收到通知，更新视图，如图所示：
<img src='https://segmentfault.com/img/bVBQY3' />


```javascript
function compile(node){
  // 节点为元素
  if(node.nodeType === 1){
    const attr = node.attribute;
    for(let i=0; i<attr.length; i++ ){
      if(attr[i].nodeName == 'v-model'){
        const name = attr[i].nodeValue;
        node.value = vm.data[name];
        node.removeAttribute('v-model')
      }
    }
  }
  if(node.nodeType === 3){
    const reg = /\{\{(.*)\}\}/;
    if(reg.test(node.nodeValue)){
      const name = RegExp.$1;
      name = name.trim();
      node.nodeValue = vm.data[name];
    }
  }
}
```

#### 六、Observer
我们知道可以利用Obeject.defineProperty()来监听属性变动
那么将需要observe的数据对象进行递归遍历，包括子属性对象的属性，都加上 setter和getter
这样的话，给这个对象的某个值赋值，就会触发setter，那么就能监听到了数据变化
```javascript
function defineReactive(data,key, val){
    observe(val);
	Object.defineProperty(data,key,{
		get(){
			return val;
		},
		set(newVal){
			if(newVal === val) return;
			val = newVal;
			console.log(val);
		}
	})
}
function observe(data){
	if(typeof data !== 'object') return;
	Object.keys(data).forEach((key) => {
		defineReactive(data, key, data[key]);
	})
}
```
```javascript
function compile(node, vm){
  // 节点为元素
  ...
  if(node.nodeType === 1){
    const attr = node.attributes;
    for(let i=0; i<attr.length; i++ ){
      if(attr[i].nodeName == 'v-model'){
        const name = attr[i].nodeValue;
        node.addEventListener('input', (e) => {
            vm.data[name] = e.target.value;
        })
        node.value = vm.data[name];
        node.removeAttribute('v-model')
    ...
```
#### 七、订阅/发布模式（subscribe&publish）
订阅发布模式（又称观察者模式）定义了一种一对多的关系，让多个观察者同时监听某一个主题对象，这个主题对象的状态发生改变时就会通知所有观察者对象。

    发布者发出通知 => 主题对象收到通知并推送给订阅者 => 订阅者执行相应操作

那么监听到变化之后就是怎么通知订阅者了，所以接下来我们需要实现一个消息订阅器，维护一个数组，用来收集订阅者，数据变动触发notify，再调用订阅者的update方法

```javascript
function Dep(){
    this.subs = [];
}
Dep.protype = {
	addSub(sub){
		this.subs.push(sub);
	},
	notify(){
		this.subs.forEach((sub) => {
			sub.updata();
		})
	}
}
```

###### 构造订阅者
```javascript
function watcher(vm, node, name){
    Dep.target = this;
	this.name = name;
	this.vm = vm;
	this.node = node;
	this.updata();
	Dep.target = null;
}
watcher.prototype = {
	updata(){
        // 一旦属性值有变化，会收到通知执行此更新函数，更新视图
		this.node.nodeValue = this.value;
	},
	get(){
		this.value = this.vm.data[this.name]
	}
}
```

```javascript
Object.defineProperty(data, key, {
    get: function() {
        // 由于需要在闭包内添加watcher，所以通过Dep定义一个全局target属性，暂存watcher, 添加完移除
        Dep.target && dep.addDep(Dep.target);
        return val;
    }
    // ... 省略
});
```
实例化订阅者，此操作会在对应的属性消息订阅器中添加了该订阅者watcher
```javascript
// ...
if(node.nodeType === 3){
    const reg = /\{\{(.*)\}\}/;
    if(reg.test(node.nodeValue)){
      let name = RegExp.$1;
      name = name.trim();
      // node.nodeValue = vm.data[name];
      new watcher(vm, node, name);
    }
  }
// ...
```
主要利用了Object.defineProperty()这个方法来劫持了vm实例对象的属性的读写权，使读写vm实例的属性转成读写了vm._data的属性值

感谢：[剖析vue实现原理，自己动手实现mvvm](https://github.com/DMQ/mvvm)
[深入vue2.0底层思想--模板渲染](https://github.com/zoro-web/blog/issues/2)