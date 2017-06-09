#ES6模块加载与Node模块加载

##1.浏览器加载

在 HTML 网页中，浏览器通过`<script>`标签加载 JavaScript 脚本。

```javascript
<!-- 页面内嵌的脚本 -->
<script type="application/javascript">
  // module code
</script>

<!-- 外部脚本 -->
<script type="application/javascript" src="path/to/myModule.js">
</script>
```
默认情况下，浏览器是同步加载 JavaScript 脚本，即渲染引擎遇到`<script>`标签就会停下来，等到执行完脚本，再继续向下渲染。如果是外部脚本，还必须加入脚本下载的时间。

如果脚本体积很大，下载和执行的时间就会很长，因此造成浏览器堵塞，用户会感觉到浏览器“卡死”了，没有任何响应。这显然是很不好的体验，所以浏览器允许脚本异步加载，下面就是两种异步加载的语法。

```javascript
<script src="path/to/myModule.js" defer></script>
<script src="path/to/myModule.js" async></script>
```
上面代码中，`<script>`标签打开 [defer][1] 或 [async][1] 属性，脚本就会异步加载。渲染引擎遇到这一行命令，就会开始下载外部脚本，但不会等它下载和执行，而是直接执行后面的命令。

[defer][1]与[async][1]的区别是：前者要等到整个页面正常渲染结束，才会执行；后者一旦下载完，渲染引擎就会中断渲染，执行这个脚本以后，再继续渲染。一句话，[defer][1]是“渲染完再执行”，[async][1]是“下载完就执行”。另外，如果有多个[defer][1]脚本，会按照它们在页面出现的顺序加载，而多个[async][1]脚本是不能保证加载顺序的。

即使这样依然会使得结构很混乱 比如：
<img width="120px" src="">

##2.ES6 模块与 CommonJS 模块的差异

讨论 Node 加载 ES6 模块之前，必须了解 ES6 模块与 CommonJS 模块完全不同。

它们有两个重大差异。

> CommonJS 模块输出的是一个值的拷贝，ES6 模块输出的是值的引用。
> CommonJS 模块是运行时加载，ES6 模块是编译时输出接口。

第二个差异是因为 `CommonJS` 加载的是一个对象（即[module.exports][0]属性），该对象只有在脚本运行完才会生成。而 ES6 模块不是对象，它的对外接口只是一种静态定义，在代码静态解析阶段就会生成。

下面重点解释第一个差异。
####CommonJS
```javascript
// lib.js
var counter = 3;
function incCounter() {
  counter++;
}
module.exports = {
  counter: counter,
  incCounter: incCounter,
};
```
上面代码输出内部变量 `counter` 和改写这个变量的内部方法`incCounter`。然后，在`main.js`里面加载这个模块

```javascript
// main.js
var mod = require('./lib');

console.log(mod.counter);  // 3
mod.incCounter();
console.log(mod.counter); // 3
```
上面代码说明，lib.js模块加载以后，它的内部变化就影响不到输出的mod.counter了。这是因为mod.counter是一个原始类型的值，会被缓存。除非写成一个函数，才能得到内部变动后的值。
```javascript
// lib.js
var counter = 3;
function incCounter() {
  counter++;
}
module.exports = {
  get counter() {
    return counter
  },
  incCounter: incCounter,
};
```
上面代码中，输出的counter属性实际上是一个取值器函数。现在再执行main.js，就可以正确读取内部变量counter的变动了。

```javascript
$ node main.js
3
4
```
####ES6
ES6 模块的运行机制与 CommonJS 不一样。JS 引擎对脚本静态分析的时候，遇到模块加载命令import，就会生成一个只读引用。等到脚本真正执行时，再根据这个只读引用，到被加载的那个模块里面去取值。换句话说，ES6 的import有点像 Unix 系统的“符号连接”，原始值变了，import加载的值也会跟着变。因此，ES6 模块是动态引用，并且不会缓存值，模块里面的变量绑定其所在的模块。
还是举上面的例子。

```javascript
// lib.js
export let counter = 3;
export function incCounter() {
  counter++;
}

// main.js
import { counter, incCounter } from './lib';
console.log(counter); // 3
incCounter();
console.log(counter); // 4
```

```javascript
// m1.js
export var foo = 'bar';
setTimeout(() => foo = 'baz', 500);

// m2.js
import {foo} from './m1.js';
console.log(foo);
setTimeout(() => console.log(foo), 500);
```
上面代码表明，ES6 模块不会缓存运行结果，而是动态地去被加载的模块取值，并且变量总是绑定其所在的模块。

由于 ES6 输入的模块变量，只是一个“符号连接”，所以这个变量是只读的，对它进行重新赋值会报错。

```javascript
// lib.js
export let obj = {};

// main.js
import { obj } from './lib';

obj.prop = 123; // OK
obj = {}; // TypeError
```
上面代码中，main.js从lib.js输入变量obj，可以对obj添加属性，但是重新赋值就会报错。因为变量obj指向的地址是只读的，不能重新赋值，这就好比main.js创造了一个名为obj的const变量。

最后，export通过接口，输出的是同一个值。不同的脚本加载这个接口，得到的都是同样的实例。
```javascript
// mod.js
function C() {
  this.sum = 0;
  this.add = function () {
    this.sum += 1;
  };
  this.show = function () {
    console.log(this.sum);
  };
}

export let c = new C();
```

上面的脚本mod.js，输出的是一个C的实例。不同的脚本加载这个模块，得到的都是同一个实例。
```javascript
// x.js
import {c} from './mod';
c.add();

// y.js
import {c} from './mod';
c.show();

// main.js
import './x';
import './y';

```

现在执行main.js，输出的是1。

##加载规则

Node 对 ES6 模块的处理比较麻烦，因为它有自己的 CommonJS 模块格式，与 ES6 模块格式是不兼容的。目前的解决方案是，将两者分开，ES6 模块和 CommonJS 采用各自的加载方案。

如果不指定绝对路径，Node 加载 ES6 模块会依次寻找以下脚本，与require()的规则一致。
```javascript
import './foo';
// 依次寻找
//   ./foo.js
//   ./foo/package.json
//   ./foo/index.js

import 'baz';
// 依次寻找
//   ./node_modules/baz.js
//   ./node_modules/baz/package.json
//   ./node_modules/baz/index.js
// 寻找上一级目录
//   ../node_modules/baz.js
//   ../node_modules/baz/package.json
//   ../node_modules/baz/index.js
// 再上一级目录
```
ES6 模块之中，顶层的this指向undefined；CommonJS 模块的顶层this指向当前模块，这是两者的一个重大差异

利用顶层的this等于undefined这个语法点，可以侦测当前代码是否在 ES6 模块之中。
```javascript
const isNotModuleScript = this !== undefined;
```
###import 命令加载 CommonJS 模块

Node 采用 CommonJS 模块格式，模块的输出都定义在module.exports这个属性上面。在 Node 环境中，使用import命令加载 CommonJS 模块，Node 会自动将module.exports属性，当作模块的默认输出，即等同于export default。

下面是一个 CommonJS 模块。
```javascript
// a.js
module.exports = {
  foo: 'hello',
  bar: 'world'
};

// 等同于
export default {
  foo: 'hello',
  bar: 'world'
};

```
import命令加载上面的模块，module.exports会被视为默认输出。

```javascript
// 写法一
import baz from './a';
// baz = {foo: 'hello', bar: 'world'};

// 写法二
import {default as baz} from './a';
// baz = {foo: 'hello', bar: 'world'};
```
如果采用整体输入的写法（import * as xxx from someModule），default会取代module.exports，作为输入的接口。

```javascript
import * as baz from './a';
// baz = {
//   get default() {return module.exports;},
//   get foo() {return this.default.foo}.bind(baz),
//   get bar() {return this.default.bar}.bind(baz)
// }
```
上面代码中，this.default取代了module.exports。需要注意的是，Node 会自动为baz添加default属性，通过baz.default拿到module.exports。

```javascript
// b.js
module.exports = null;

// es.js
import foo from './b';
// foo = null;

import * as bar from './b';
// bar = {default:null};
```
上面代码中，es.js采用第二种写法时，要通过bar.default这样的写法，才能拿到module.exports。

下面是另一个例子。


```javascript
// c.js
module.exports = function two() {
  return 2;
};

// es.js
import foo from './c';
foo(); // 2

import * as bar from './c';
bar.default(); // 2
bar(); // throws, bar is not a function
```

上面代码中，bar本身是一个对象，不能当作函数调用，只能通过bar.default调用。

CommonJS 模块的输出缓存机制，在 ES6 加载方式下依然有效。

```javascript
// foo.js
module.exports = 123;
setTimeout(_ => module.exports = null);
```

上面代码中，对于加载foo.js的脚本，module.exports将一直是123，而不会变成null。


由于 ES6 模块是编译时确定输出接口，CommonJS 模块是运行时确定输出接口，所以采用import命令加载 CommonJS 模块时，不允许采用下面的写法。
```javascript
import {readfile} from 'fs';
```
上面的写法不正确，因为fs是 CommonJS 格式，只有在运行时才能确定readfile接口，而import命令要求编译时就确定这个接口。解决方法就是改为整体输入。

```javascript
import * as express from 'express';
const app = express.default();

import express from 'express';
const app = express();
```


###require 命令加载 ES6 模块

采用require命令加载 ES6 模块时，ES6 模块的所有输出接口，会成为输入对象的属性。

```javascript
// es.js
let foo = {bar:'my-default'};
export default foo;
foo = null;

// cjs.js
const es_namespace = require('./es');
console.log(es_namespace.default);
// {bar:'my-default'}
```
上面代码中，default接口变成了es_namespace.default属性。另外，由于存在缓存机制，es.js对foo的重新赋值没有在模块外部反映出来。

下面是另一个例子。

```javascript
// es.js
export let foo = {bar:'my-default'};
export {foo as bar};
export function f() {};
export class c {};

// cjs.js
const es_namespace = require('./es');
// es_namespace = {
//   get foo() {return foo;}
//   get bar() {return foo;}
//   get f() {return f;}
//   get c() {return c;}
// }
```


##4.循环加载

“循环加载”（circular dependency）指的是，a脚本的执行依赖b脚本，而b脚本的执行又依赖a脚本。
```javascript
// a.js
var b = require('b');

// b.js
var a = require('a');
```

通常，“循环加载”表示存在强耦合，如果处理不好，还可能导致递归加载，使得程序无法执行，因此应该避免出现。

但是实际上，这是很难避免的，尤其是依赖关系复杂的大项目，很容易出现a依赖b，b依赖c，c又依赖a这样的情况。这意味着，模块加载机制必须考虑“循环加载”的情况。

对于JavaScript语言来说，目前最常见的两种模块格式CommonJS和ES6，处理“循环加载”的方法是不一样的，返回的结果也不一样。


####CommonJS模块的加载原理

介绍ES6如何处理"循环加载"之前，先介绍目前最流行的CommonJS模块格式的加载原理。

CommonJS的一个模块，就是一个脚本文件。require命令第一次加载该脚本，就会执行整个脚本，然后在内存生成一个对象。

```javascript
{
  id: '...',
  exports: { ... },
  loaded: true,
  ...
}
```
上面代码就是Node内部加载模块后生成的一个对象。该对象的id属性是模块名，exports属性是模块输出的各个接口，loaded属性是一个布尔值，表示该模块的脚本是否执行完毕。其他还有很多属性，这里都省略了。

以后需要用到这个模块的时候，就会到exports属性上面取值。即使再次执行require命令，也不会再次执行该模块，而是到缓存之中取值。也就是说，CommonJS模块无论加载多少次，都只会在第一次加载时运行一次，以后再加载，就返回第一次运行的结果，除非手动清除系统缓存。


###CommonJS模块的循环加载

CommonJS模块的重要特性是加载时执行，即脚本代码在require的时候，就会全部执行。一旦出现某个模块被"循环加载"，就只输出已经执行的部分，还未执行的部分不会输出。

让我们来看，Node官方文档里面的例子。脚本文件a.js代码如下

```javascript
exports.done = false;
var b = require('./b.js');
console.log('在 a.js 之中，b.done = %j', b.done);
exports.done = true;
console.log('a.js 执行完毕');
```
上面代码之中，a.js脚本先输出一个done变量，然后加载另一个脚本文件b.js。注意，此时a.js代码就停在这里，等待b.js执行完毕，再往下执行。

再看b.js的代码。

```javascript
exports.done = false;
var a = require('./a.js');
console.log('在 b.js 之中，a.done = %j', a.done);
exports.done = true;
console.log('b.js 执行完毕');
```
上面代码之中，b.js执行到第二行，就会去加载a.js，这时，就发生了“循环加载”。系统会去a.js模块对应对象的exports属性取值，可是因为a.js还没有执行完，从exports属性只能取回已经执行的部分，而不是最后的值。

a.js已经执行的部分，只有一行。

```javascript
exports.done = false;
```
因此，对于b.js来说，它从a.js只输入一个变量done，值为false。

然后，b.js接着往下执行，等到全部执行完毕，再把执行权交还给a.js。于是，a.js接着往下执行，直到执行完毕。我们写一个脚本main.js，验证这个过程。


```javascript
var a = require('./a.js');
var b = require('./b.js');
console.log('在 main.js 之中, a.done=%j, b.done=%j', a.done, b.done);
```
执行main.js，运行结果如下
```javascript
$ node main.js

在 b.js 之中，a.done = false
b.js 执行完毕
在 a.js 之中，b.done = true
a.js 执行完毕
在 main.js 之中, a.done=true, b.done=true
```
上面的代码证明了两件事。一是，在b.js之中，a.js没有执行完毕，只执行了第一行。二是，main.js执行到第二行时，不会再次执行b.js，而是输出缓存的b.js的执行结果，即它的第四行。

```javascript
exports.done = true;
```
总之，CommonJS输入的是被输出值的拷贝，不是引用。

另外，由于CommonJS模块遇到循环加载时，返回的是当前已经执行的部分的值，而不是代码全部执行后的值，两者可能会有差异。所以，输入变量的时候，必须非常小心。

```javascript
var a = require('a'); // 安全的写法
var foo = require('a').foo; // 危险的写法

exports.good = function (arg) {
  return a.foo('good', arg); // 使用的是 a.foo 的最新值
};

exports.bad = function (arg) {
  return foo('bad', arg); // 使用的是一个部分加载时的值
};
```
上面代码中，如果发生循环加载，require('a').foo的值很可能后面会被改写，改用require('a')会更保险一点。

###ES6模块的循环加载

ES6处理“循环加载”与CommonJS有本质的不同。ES6模块是动态引用，如果使用import从一个模块加载变量（即import foo from 'foo'），那些变量不会被缓存，而是成为一个指向被加载模块的引用，需要开发者自己保证，真正取值的时候能够取到值。

请看下面这个例子。

```javascript
// a.js如下
import {bar} from './b.js';
console.log('a.js');
console.log(bar);
export let foo = 'foo';

// b.js
import {foo} from './a.js';
console.log('b.js');
console.log(foo);
export let bar = 'bar';
```
上面代码中，a.js加载b.js，b.js又加载a.js，构成循环加载。执行a.js，结果如下。
```javascript
$ babel-node a.js
b.js
undefined
a.js
bar
```
上面代码中，由于a.js的第一行是加载b.js，所以先执行的是b.js。而b.js的第一行又是加载a.js，这时由于a.js已经开始执行了，所以不会重复执行，而是继续往下执行b.js，所以第一行输出的是b.js。

接着，b.js要打印变量foo，这时a.js还没执行完，取不到foo的值，导致打印出来是undefined。b.js执行完，开始执行a.js，这时就一切正常了。




```javascript
// a.js
import {bar} from './b.js';
export function foo() {
  console.log('foo');
  bar();
  console.log('执行完毕');
}
foo();

// b.js
import {foo} from './a.js';
export function bar() {
  console.log('bar');
  if (Math.random() > 0.5) {
    foo();
  }
}
```
按照CommonJS规范，上面的代码是没法执行的。a先加载b，然后b又加载a，这时a还没有任何执行结果，所以输出结果为null，即对于b.js来说，变量foo的值等于null，后面的foo()就会报错。

但是，ES6可以执行上面的代码。

```javascript
$ babel-node a.js
foo
bar
执行完毕

// 执行结果也有可能是
foo
bar
foo
bar
执行完毕
执行完毕
```
上面代码中，a.js之所以能够执行，原因就在于ES6加载的变量，都是动态引用其所在的模块。只要引用存在，代码就能执行。

下面，我们详细分析这段代码的运行过程。
```javascript
// a.js

// 这一行建立一个引用，
// 从`b.js`引用`bar`
import {bar} from './b.js';

export function foo() {
  // 执行时第一行输出 foo
  console.log('foo');
  // 到 b.js 执行 bar
  bar();
  console.log('执行完毕');
}
foo();

// b.js

// 建立`a.js`的`foo`引用
import {foo} from './a.js';

export function bar() {
  // 执行时，第二行输出 bar
  console.log('bar');
  // 递归执行 foo，一旦随机数
  // 小于等于0.5，就停止执行
  if (Math.random() > 0.5) {
    foo();
  }
}
```
我们再来看ES6模块加载器SystemJS给出的一个例子。
```javascript
// even.js
import { odd } from './odd'
export var counter = 0;
export function even(n) {
  counter++;
  return n == 0 || odd(n - 1);
}

// odd.js
import { even } from './even';
export function odd(n) {
  return n != 0 && even(n - 1);
}
```
上面代码中，even.js里面的函数even有一个参数n，只要不等于0，就会减去1，传入加载的odd()。odd.js也会做类似操作。

运行上面这段代码，结果如下。
```javascript
$ babel-node
> import * as m from './even.js';
> m.even(10);
true
> m.counter
6
> m.even(20)
true
> m.counter
17
```
上面代码中，参数n从10变为0的过程中，even()一共会执行6次，所以变量counter等于6。第二次调用even()时，参数n从20变为0，even()一共会执行11次，加上前面的6次，所以变量counter等于17。

这个例子要是改写成CommonJS，就根本无法执行，会报错。
```javascript
// even.js
var odd = require('./odd');
var counter = 0;
exports.counter = counter;
exports.even = function(n) {
  counter++;
  return n == 0 || odd(n - 1);
}

// odd.js
var even = require('./even').even;
module.exports = function(n) {
  return n != 0 && even(n - 1);
}
```
上面代码中，even.js加载odd.js，而odd.js又去加载even.js，形成“循环加载”。这时，执行引擎就会输出even.js已经执行的部分（不存在任何结果），所以在odd.js之中，变量even等于null，等到后面调用even(n-1)就会报错。
```javascript
$ node
> var m = require('./even');
> m.even(10)
TypeError: even is not a function
```


[1]: ' '





































