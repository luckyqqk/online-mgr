# online-mgr
distributed service online-mgr use redis set

### 分布式在线用户管理器
使用redis集合(set)结构,将通讯服的ID作为set的key,将在该通讯服中的userId放入set集合中

### 需求分析
系统中使用了第三方充值系统,会不断的扫描第三方充值结果.
扫到结果后,需要通知玩家充值成功.那么就需要获得玩家的通讯服.(当然不在线就不处理了)
使用redis做在线用户管理器的方案有4种之多:zset,set,HyperLogLog和位图,从空间和功能两方面考虑,优劣各有.

我们用的是分布式系统,user们会处于不同的通讯服(connectors)
于是选择使用redis集合(set)结构,将通讯服的ID作为set的key,将在该通讯服中的userId放入set集合中
结构就像这样
```
  conn1   :   [userId1...userIdn],
  conn2   :   [userId1...userIdn],
  conn3   :   [userId1...userIdn],
```
### 适用场景
该管理器(叫插件也行),相比HyperLogLog和位图会占用更大的空间,但会存储connId.
基本能适用绝大多数的在线管理需求.
如果需要用redis做几日存留的计算统计,可自行扩展该插件,或在该插件外部自行处理.

### 安装
npm i online-mgr --save

### 支持方法
#### 新增在线
```
@param sid   connId
@param uid   userId
addOnlineUser(sid, uid)
```

 #### 删除在线
```
@param sid   connId
@param uid   userId
remOnlineUser(sid, uid)
```
 
 #### 获得在线用户列表
```
@param sid   connId
getOnlineUsers(sid)
```

 #### 获得在线用户数量
```
@param sid   connId
getOnlineNum(sid)
```

 #### 检测是否在线
```
@param uid
isOnline(uid)
```

 #### 获得玩家所在的通讯服id
```
@param uid
getSidByUid(uid)
```

 #### 清空在线记录
```
cleanOnlineUsers()
```
