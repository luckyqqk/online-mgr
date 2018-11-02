/**
 * Created by qingkai.wu on 2018/11/1.
 */

const PRE_FIX = 'ONLINE:';

/**
 * 分布式在线用户管理器
 *
 * 分布式系统的user们会处于不同的通讯服(connectors)
 * 于是我使用redis集合(set)结构,将通讯服的ID作为set的key,将在该通讯服中的userId放入set集合中
 *
 * 像这样
 *  conn1   :   [userId1...userIdn],
 *  conn2   :   [userId1...userIdn],
 *  conn3   :   [userId1...userIdn],
 * @param redis
 */
const onlineMgr = function(redis) {
    this.redis = redis;
};

/**
 * 新增在线
 * @param sid   connId
 * @param uid   userId
 * @returns {Promise}
 */
onlineMgr.prototype.addOnlineUser = function(sid, uid) {
    return new Promise((resolve, reject)=>{
        this.redis.sadd(_getKey(sid), uid, (err, data)=>{
            if (!!err)
                reject(err);
            else
                resolve(data);
        });
    });
};

/**
 * 删除在线
 * @param sid   connId
 * @param uid   userId
 * @returns {Promise}
 */
onlineMgr.prototype.remOnlineUser = function(sid, uid) {
    return new Promise((resolve, reject)=>{
        this.redis.srem(_getKey(sid), uid, (err, data)=>{
            if (!!err)
                reject(err);
            else
                resolve(data);
        });
    });
};

/**
 * 获得在线用户列表
 * @param sid   connId
 * @returns {Promise}
 */
onlineMgr.prototype.getOnlineUsers = function(sid) {
    return new Promise((resolve, reject)=>{
        this.redis.smembers(_getKey(sid), (err, data)=>{
            if (!!err)
                reject(err);
            else
                resolve(data);
        });
    });
};

/**
 * 获得在线用户数量
 * @param sid   connId
 * @returns {Promise}
 */
onlineMgr.prototype.getOnlineNum = function(sid) {
    return new Promise((resolve, reject)=>{
        this.redis.scard(_getKey(sid), (err, data)=>{
            if (!!err)
                reject(err);
            else
                resolve(data);
        });
    });
};

/**
 * 检测是否在线
 * @param uid
 * @returns {Promise}
 */
onlineMgr.prototype.isOnline = function(uid) {
    return new Promise((resolve, reject)=>{
        onlineMgr.getSidsByUid(uid).then(sid=>{
            resolve(!!sid);
        }).catch(reject);
    });
};

const getSidLua = `
                    local keys = redis.call('keys', KEYS[1])
                    local sid = 0
                    for i=1,#keys do
                        local res = redis.call('sismember', keys[i], ARGV[1])
                        if res == 1 then
                            sid = keys[i]
                            break
                        end
                    end
                    return sid`;
/**
 * 获得玩家所在的通讯服id
 * @param uid
 * @returns {Promise}
 */
onlineMgr.prototype.getSidByUid = function(uid) {
    return new Promise((resolve, reject)=>{
        this.redis.eval(getSidLua, 1, PRE_FIX + "*", uid, (err, data)=>{
            if (!!err)
                reject(err);
            else if (!data)
                resolve(data);
            else
                resolve(data.split(':')[1]);
        });
    });
};

/**
 * 清空在线记录
 * @returns {Promise}
 */
onlineMgr.prototype.cleanOnlineUsers = function() {
    return new Promise((resolve, reject)=>{
        _getOnlineKeys(this.redis).then(data=>{
            if (!data || data.length == 0) {
                resolve();
                return;
            }
            let delArr = [];
            data.forEach(onlineKey=>{
                delArr.push(['del', onlineKey]);
            });
            redis.multi(delArr).exec((err, data)=>{
                if (!!err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        }).catch(reject)
    });
};

function _getOnlineKeys(redis) {
    return new Promise((resolve, reject)=>{
        redis.keys(PRE_FIX + '*', (err, data)=>{
            if (!!err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

function _getKey(sid) {
    return PRE_FIX + sid;
}

module.exports = onlineMgr;