const screepsplus = require('screepsplus');

var lastTimeStep = null,
    timeSteps = [],
    targetCount = null;

var iconResting     = '📻',
    iconRepairing   = '🔧',
    iconHarvesting  = '⛏',
    iconDropOff     = '📥',
    iconPickUp      = '📤',
    iconBuilding    = '🛠',
    iconClaiming    = '💸',
    iconAttack      = '🔫',
    iconHealing     = '💊',
    iconMoving      = '👞',
    iconDefending   = '🛡',
    iconScouting    = '👁️';

function position(obj)
{
    var pos      = tryGet(obj, 'pos');

    if(isset(pos))
    {
        obj = pos;
    }

    var x        = tryGet(obj, 'x'),
        y        = tryGet(obj, 'y'),
        roomName = tryGet(obj, 'roomName');

    if(isset(x) && isset(y) && isset(roomName))
    {
        return new RoomPosition(x, y, roomName);
    }

    return null;
}

function markTimeStep(name, status)
{
    var newTimeStep = Game.cpu.getUsed(),
        timeDiff = newTimeStep - lastTimeStep;

    status = status ? status : 'N/A';

    timeSteps.push({
        name: name,
        status: status,
        timeDiff: timeDiff,
        timeStep: newTimeStep
    });
    lastTimeStep = newTimeStep;
}

function randomKey()
{
    return Math.random().toString(36).substr(2, 9);
}

function fillArray(value, len)
{
    var arr = [];

    for (var i = 0; i < len; i++)
    {
        arr.push(value);
    }

    return arr;
}

function sum(arr, callback)
{
    var result = 0;

    each(arr, function(item, key)
    {
        result += callback(item, key);
    });

    return result;
}

function dump(val)
{
    console.log(JSON.stringify(val));
}

function setStatus(creepMemory, status, target)
{
    target = target && target.id ? target.id : target;
    creepMemory.status = status;
    creepMemory.target = target;
}

function setTargetIfNone(creepMemory, target, callback)
{
    var memTarget = Game.getObjectById(creepMemory.target);
    target = target && target.id ? target.id : target;

    if(!isset(creepMemory.target) || !isset(memTarget) || (isset(callback) && !callback(memTarget)))
    {
        creepMemory.target = target;
    }
    return creepMemory.target;
}

function findFirstKeyWhere(obj, value)
{
    var key;

    _.find(obj, function(v, k)
    {
        if (v === value)
        {
            key = k;
            return true;
        }
    });

    return key;
}

function offset(room, x, y)
{
    //W11N38
    var name = tryGet(room, 'name');
    if(isString(name))
    {
        var coords = name.replace('W', '').split('N');

        if(isset(coords) && isset(coords[0], coords[1]))
        {
            coords[0] = parseInt(coords[0]) + x;
            coords[1] = parseInt(coords[1]) + y;

            var roomName = 'W' + coords[0] + 'N' + coords[1];

            return tryGet(Game.rooms, roomName);
        }
    }

    return null;
}

function firstWhere(obj, callback)
{
    var resKey  = null;
    var found   = !_.every(_.keys(obj), function(key)
    {
        resKey = key;
        return !callback(obj[key]);
    });

    return found ? obj[resKey] : null;
}

function map(obj, callback, depth, _depth)
{
    depth = isset(depth) ? depth : 0;
    _depth = isset(_depth) ? _depth : 0;
    if(isset(obj, callback) && typeof callback == 'function')
    {
        if((isArray(obj) || isObject(obj)) && _depth < depth)
        {
            each(obj, function(val, key)
            {
                obj[key] = map(val, callback, depth, _depth + 1);
            })
        }

        return callback(obj);
    }

    return obj;
}

function sortBy(obj, callback)
{
    return _.sortBy(obj, callback);
}

function inverseOrder(obj)
{
    var count = _.size(obj);

    return sortBy(obj, function()
    {
        return count--;
    });
}

function lastWhere(obj, callback)
{
    var count   = _.size(obj),
        resKey  = null;

    var found = !_.every(inverseOrder(_.keys(obj)), function(key)
    {
        resKey = key;
        return !callback(obj[key]);
    });

    return found ? obj[resKey] : null;
}

function each(obj, callback)
{
    return _.each(obj, callback);
}

function findByTypes(room, find, types)
{
    // room    = isArray(room) ? room : [room];
    find    = isArray(find) ? find : [find];
    types   = isArray(types) ? types : [types];

    var result = [];

    each(find, function(f)
    {
        if(isset(room))
        {
            var found = room.find(f, {
                filter: function(structure)
                {
                    return types.includes(structure.structureType);
                }
            });

            if(isset(found) && isArray(found))
            {
                result = result.concat(found);
            }
        }
        // each(room, function(r)
        // {
        //     if(isset(r))
        //     {
        //
        //     }
        // });
    });

    return result;
}

function object(obj)
{
    if(typeof obj != 'string')
    {
        return null;
    }
    return Game.getObjectById(obj);
}

function transfer(creep, target, type)
{
    target = object(target);
    if(isset(target))
    {
        creep.transfer(target, type)
    }
}

function attack(creep, target)
{
    target = object(target);
    if(isset(target))
    {
        creep.attack(target)
    }
}

function heal(creep, target)
{
    target = object(target);
    if(isset(target))
    {
        creep.heal(target)
    }
}

function harvest(creep, target)
{
    target = object(target);
    if(isset(target))
    {
        creep.harvest(target)
    }
}

function withdraw(creep, target, type)
{
    target = object(target);
    if(isset(target))
    {
        creep.withdraw(target, type);
    }
}

function build(creep, target)
{
    target = object(target);
    if(isset(target))
    {
        creep.build(target);
    }
}

function upgradeController(creep, target)
{
    target = object(target);
    if(isset(target))
    {
        creep.upgradeController(target);
    }
}

function pickup(creep, target)
{
    target = object(target);
    if(isset(target))
    {
        creep.pickup(target);
    }
}

function moveTo(creep, target, within)
{
    within = isset(within) ? within : 1;

    if(isset(creep) && isset(creep.name) && isset(target))
    {
        var options = {},
            index   = _.indexOf(_.keys(Memory.creeps), creep.name),
            colors  = [
                '#9b232b',
                '#c3578d',
                '#ff00ff',
                '#b103bd',
                '#1a6e7e',
                '#4034de',
                '#16fcd6',
                '#3ef03c',
                '#c6fd20',
                '#829622',
                '#fdb450',
            ],
            color   = colors[index % colors.length];

        if(Memory.displayPath)
        {
            options['visualizePathStyle'] = {
                fill: 'transparent',
                stroke: color,
                lineStyle: 'dashed',
                strokeWidth: .15,
                opacity: .5
            };
        }

        if(typeof target == 'string')
        {
            target = Game.getObjectById(target);
        }
        else
        {
            target = position(target);
        }

        // dump(target);

        // if(within && creep.pos.inRangeTo(target, within))
        // {
        //     return;
        // }

        creep.moveTo(target, options);
    }
}

function all(obj, callback)
{
    if(isset(obj, callback) && typeof callback == 'function')
    {
        var result = true;

        each(obj, function(val)
        {
            result &= callback(val);
        });

        return result;
    }
    return false;
}

function isset(...val)
{
    var result = true;

    each(val, function(val)
    {
        result &= val != undefined && val != null;
    });

    return result;
}

function tryGet(val, attr, def)
{
    def = isset(def) ? def : null;
    if(isString(attr) && attr.includes('.'))
    {
        return tryGetChain(val, attr, def);
    }

    return isset(val) && val[attr] != undefined ? val[attr] : def;
}

function tryGetChain(val, path, def)
{
    def = isset(def) ? def : null;
    var res = def;

    if(val && path)
    {
        path = path.split('.');
        res  = val;
        _.every(path, function(attr)
        {
            if(isset(res) && res[attr] != undefined)
            {
                res = res[attr];
                return true;
            }
            res = def;
            return false;
        });
    }

    return res;
}

function getEnergy(struct, def)
{
    def = isset(def) ? def : 0;

    if(isset(struct) && isset(struct.energy))
    {
        return struct.energy;
    }
    else if(isset(struct) && isset(struct.store) && isset(struct.store[RESOURCE_ENERGY]))
    {
        return struct.store[RESOURCE_ENERGY];
    }

    return def;
}

function getEnergyCapacity(struct, def)
{
    def = isset(def) ? def : 0;

    if(isset(struct) && isset(struct.energyCapacity))
    {
        return struct.energyCapacity;
    }
    else if(isset(struct) && isset(struct.storeCapacity))
    {
        return struct.storeCapacity;
    }

    return def;
}

function isObject(obj)
{
    return typeof obj == 'array';
}

function isArray(obj)
{
    return typeof obj == 'object';
}

function isString(obj)
{
    return typeof obj == 'string';
}

function say(creep, message, show)
{
    show = isset(show) ? show : true;
    if(show)
    {
        creep.say(message);
    }
}

function getAllInArea(room, area)
{
    return room.lookAtArea(area.top, area.left, area.bottom, area.right, true);
}

function extend()
{
    for(var i=1; i<arguments.length; i++)
    {
        for(var key in arguments[i])
        {
            if(arguments[i].hasOwnProperty(key))
            {
                arguments[0][key] = arguments[i][key];
            }
        }
    }
    return arguments[0];
}

function copy(value)
{
    return extend({}, value);
}

function replace(a, b)
{
    var result = copy(a);

    each(b, function(val, key)
    {
        result[key] = val;
    });

    return result;
}

function comp(a, o, b)
{
    if(!isset(a, b))
    {
        return null;
    }

    var code = a+' '+o+' '+b,
        result = NaN;

    try
    {
        result = eval(code);
    }
    catch(exception)
    {
        return null;
    }

    return result;
}

function getValidTarget(target)
{
    if(isString(target))
    {
        return isset(object(target)) ? target : null;
    }
    else
    {
        return isset(position(target)) ? target : null;
    }
}

function processSpawn(spawn)
{
    var room = spawn.room;

    //dump(offset(room, 1, 0));

    // Memory.stats = isset(Memory.stats) ? Memory.stats : {};
    // Memory.stats["room." + room.name + ".energyAvailable"] = room.energyAvailable;
    // Memory.stats["room." + room.name + ".energyCapacityAvailable"] = room.energyCapacityAvailable;
    // Memory.stats["room." + room.name + ".controllerProgress"] = room.controller.progress;

    var primMemory = {
        spawn   : spawn.id,
        target  : null,
        ticksToLive: {
            min: 500
        }
    };
    var screepsToMake = {
        // harvester: {
        //     count: 4,
        //     body: fillArray(WORK, 1).concat(fillArray(MOVE, 2)).concat(fillArray(CARRY, 2)),
        //     name: 'harvester-' + randomKey(),
        //     options: {
        //         memory: {
        //             type    : 'harvester',
        //             status  : 'harvesting',
        //         }
        //     }
        // },
        // provider: {
        //     count: 2,
        //     body: fillArray(WORK, 1).concat(fillArray(MOVE, 2)).concat(fillArray(CARRY, 2)),
        //     name: 'provider-' + randomKey(),
        //     options: {
        //         memory: {
        //             type    : 'provider',
        //             status  : 'collecting',
        //         }
        //     }
        // },
        // builder: {
        //     count: 2,
        //     body: fillArray(WORK, 1).concat(fillArray(MOVE, 2)).concat(fillArray(CARRY, 2)),
        //     name: 'builder-' + randomKey(),
        //     options: {
        //         memory: {
        //             type    : 'builder',
        //             status  : 'collecting',
        //         }
        //     }
        // },
        'harvester-v2': {
            count: 6,
            body: fillArray(WORK, 4).concat(fillArray(MOVE, 4)).concat(fillArray(CARRY, 4)),
            name: 'harvester-v2-' + randomKey(),
            options: {
                memory: {
                    type    : 'harvester',
                    status  : 'harvesting',
                }
            }
        },
        'builder-v2': {
            count: 2,
            body: fillArray(WORK, 4).concat(fillArray(MOVE, 10)).concat(fillArray(CARRY, 6)),
            name: 'builder-v2-' + randomKey(),
            options: {
                memory: {
                    type    : 'builder',
                    status  : 'collecting',
                }
            }
        },
        'provider-v2': {
            count: 2,
            body: fillArray(WORK, 4).concat(fillArray(MOVE, 4)).concat(fillArray(CARRY, 4)),
            name: 'provider-' + randomKey(),
            options: {
                memory: {
                    type    : 'provider',
                    status  : 'collecting',
                }
            }
        },
        treasurer: {
            count: 1,
            body: fillArray(MOVE, 5).concat(fillArray(CARRY, 10)),
            name: 'treasurer-' + randomKey(),
            options: {
                memory: {
                    type    : 'treasurer',
                    status  : 'collecting',
                }
            }
        },
        warrior: {
            count: 1,
            body: fillArray(ATTACK, 10).concat(fillArray(MOVE, 10)),
            name: 'warrior-' + randomKey(),
            options: {
                memory: {
                    type    : 'warrior',
                    status  : 'defending',
                    waitingArea: {
                        x: 32,
                        y: 25,
                        roomName: 'W11N38'
                    },
                    targetArea: {
                        top: 0,
                        bottom: 49,
                        left: 0,
                        right: 49
                    }
                }
            }
        },
        healer: {
            count: 1,
            body: fillArray(HEAL, 4).concat(fillArray(MOVE, 6)),
            name: 'healer-' + randomKey(),
            options: {
                memory: {
                    type    : 'healer',
                    status  : 'healing',
                }
            }
        },
        // miner: {
        //     count: 0,
        //     body: fillArray(MOVE, 3).concat(fillArray(CARRY, 3)).concat(fillArray(WORK, 10)),
        //     name: 'miner-' + randomKey(),
        //     options: {
        //         memory: {
        //             type    : 'miner',
        //             status  : 'waiting',
        //         }
        //     }
        // },
        // mover: {
        //     count: 0,
        //     body: fillArray(MOVE, 13).concat(fillArray(CARRY, 13)),
        //     name: 'mover-' + randomKey(),
        //     options: {
        //         memory: {
        //             type    : 'mover',
        //             status  : 'waiting',
        //         }
        //     }
        // },
        // paver: {
        //     count: 1,
        //     body: fillArray(MOVE, 15).concat(fillArray(WORK, 6)).concat(fillArray(CARRY, 9)),
        //     name: 'paver-' + randomKey(),
        //     options: {
        //         memory: {
        //             type    : 'paver',
        //             status  : 'waiting',
        //             ticksToLive : {
        //                 min: 1000
        //             }
        //         }
        //     }
        // },
        // scout: {
        //     count: 2,
        //     body: fillArray(MOVE, 1),
        //     name: 'scout-' + randomKey(),
        //     options: {
        //         memory: {
        //             type    : 'scout',
        //             status  : 'scouting',
        //             ticksToLive : {
        //                 min: 750
        //             }
        //         }
        //     }
        // }
    };

    if(!Memory.creeps[Memory.creepToRepair])
    {
        Memory.creepToRepair = null;
    }

    var typeCount = {};

    targetCount = {};

    each(Memory.creeps, function(creepMemory, creepName)
    {
        var tgt = Game.getObjectById(creepMemory.target);

        if(!typeCount[creepMemory.type])
        {
            typeCount[creepMemory.type] = 0;
        }
        typeCount[creepMemory.type]++;

        if(tgt && tgt.id)
        {
            targetCount[tgt.id] = targetCount[tgt.id] ? targetCount[tgt.id] : [];
            targetCount[tgt.id]++;
        }
    });

    Memory.typeCount = typeCount;

    var waitingAreaFlag = _.first(room.find(FIND_FLAGS, {
        filter: { name: 'WaitingArea' }
    }));

    each(screepsToMake, function(template, key)
    {
        template.options.memory = map(template.options.memory, function(memory)
        {
            return replace(primMemory, memory);
        });
        key = template.options.memory.type;
        if(!spawn.spawning && ((isset(Memory.typeCount[key]) && Memory.typeCount[key] < template.count) || (template.count && !isset(Memory.typeCount[key]))))
        {
            console.log("Spawn status: " + spawn.spawnCreep(template.body, template.name, template.options));
        }
    });

    var displayIndex = 0,
        displayChunks = 4;

    var source          = object(Memory.targets.source),
        structure       = object(Memory.targets.structure),
        batteryIn       = object(Memory.targets.batteryIn),
        batteryOut      = object(Memory.targets.batteryOut),
        treasureFrom    = object(Memory.targets.treasureFrom),
        treasureTo      = object(Memory.targets.treasureTo),
        control         = object(Memory.targets.control);

    each(Memory.creeps, function(creepMemory, creepName)
    {
        var displayIcon = Memory.displayIcon;//Game.time % 4 <= 2;//displayIndex++ % displayChunks == Game.time % displayChunks,
        status      = creepMemory.status,
            target      = getValidTarget(creepMemory.target),
            creep       = Game.creeps[creepName];

        if(!creep)
        {
            delete Memory.creeps[creepName];
            return;
        }

        var waitingArea = tryGet(creepMemory, 'waitingArea', waitingAreaFlag);

        if(!Memory.creepToRepair && creep.ticksToLive < tryGet(creepMemory, 'ticksToLive.min', 500))
        {
            Memory.creepToRepair = creepName;
        }

        if(creepName == Memory.creepToRepair)
        {
            var maxTicksToLive = tryGet(creepMemory, 'ticksToLive.max', false);
            if(maxTicksToLive && creep.ticksToLive > maxTicksToLive)
            {
                Memory.creepToRepair = null;
            }
            else
            {
                moveTo(creep, spawn);
                if(spawn.renewCreep(creep) == -8)
                {
                    Memory.creepToRepair = null;
                }
                say(creep, iconRepairing, displayIcon);
                return;
            }
        }
        else if(creepMemory.status == 'repairing')
        {
            moveTo(creep, spawn);
            spawn.renewCreep(creep);
            say(creep, iconRepairing, displayIcon);
            return;
        }

        if(creepMemory.status == 'waiting')
        {
            moveTo(creep, waitingArea);
            say(creep, iconResting, displayIcon);
            return;
        }

        if(creepMemory.status == 'goto')
        {
            moveTo(creep, target);
            say(creep, iconMoving, displayIcon);
            return;
        }

        switch(creepMemory.type)
        {
            case 'harvester': {
                switch(status)
                {
                    case 'harvesting': {
                        target = setTargetIfNone(creepMemory, source, function(source)
                        {
                            if(targetCount[source.id] > Memory.maxCreepsPerSource)
                            {
                                targetCount[source.id]--;
                                return false;
                            }
                            return true;
                        });
                        if(creep.carry[RESOURCE_ENERGY] >= creep.carryCapacity)
                        {
                            setStatus(creepMemory, 'storing');
                        }
                        else if(target)
                        {
                            moveTo(creep, target);
                            harvest(creep, target);
                            say(creep, iconHarvesting, displayIcon);
                        }
                        else
                        {
                            moveTo(creep, waitingArea);
                            say(creep, iconResting, displayIcon);
                        }
                    } break;
                    case 'storing': {
                        target = setTargetIfNone(creepMemory, batteryIn, function(target)
                        {
                            return getEnergy(target) < getEnergyCapacity(target);
                        });
                        if(creep.carry[RESOURCE_ENERGY] == 0)
                        {
                            setStatus(creepMemory, 'harvesting');
                        }
                        else if(target)
                        {
                            moveTo(creep, target);
                            transfer(creep, target, RESOURCE_ENERGY);
                            say(creep, iconDropOff, displayIcon);
                        }
                        else
                        {
                            moveTo(creep, waitingArea);
                            say(creep, iconResting, displayIcon);
                        }
                    } break;
                }
            } break;
            case 'builder': {
                switch(status)
                {
                    case 'collecting': {
                        target = setTargetIfNone(creepMemory, batteryOut, function(target)
                        {
                            return getEnergy(target) < getEnergyCapacity(target);
                        });
                        if(creep.carry[RESOURCE_ENERGY] == creep.carryCapacity)
                        {
                            setStatus(creepMemory, 'building');
                        }
                        else if(target)
                        {
                            moveTo(creep, target);
                            withdraw(creep, target, RESOURCE_ENERGY);
                            say(creep, iconPickUp, displayIcon);
                        }
                        else
                        {
                            moveTo(creep, waitingArea);
                            say(creep, iconResting, displayIcon);
                        }
                    } break;
                    case 'building': {
                        target = setTargetIfNone(creepMemory, structure);
                        if(creep.carry[RESOURCE_ENERGY] == 0)
                        {
                            setStatus(creepMemory, 'collecting');
                        }
                        else if(target)
                        {
                            moveTo(creep, target);
                            build(creep, target, RESOURCE_ENERGY);
                            say(creep, iconBuilding, displayIcon);
                        }
                        else
                        {
                            moveTo(creep, waitingArea);
                            say(creep, iconResting, displayIcon);
                        }
                    } break;
                }
            } break;
            case 'provider': {
                switch(status)
                {
                    case 'collecting': {
                        target = setTargetIfNone(creepMemory, batteryOut, function(target)
                        {
                            return getEnergy(target) > 0;
                        });
                        if(creep.carry[RESOURCE_ENERGY] == creep.carryCapacity)
                        {
                            setStatus(creepMemory, 'providing');
                        }
                        else if(target)
                        {
                            moveTo(creep, target);
                            withdraw(creep, target, RESOURCE_ENERGY);
                            say(creep, iconPickUp, displayIcon);
                        }
                    } break;
                    case 'providing': {
                        target = setTargetIfNone(creepMemory, control);
                        if(creep.carry[RESOURCE_ENERGY] == 0)
                        {
                            setStatus(creepMemory, 'collecting');
                        }
                        else if(target)
                        {
                            moveTo(creep, target);
                            upgradeController(creep, target);
                            say(creep, iconClaiming, displayIcon);
                        }
                    } break;
                }
            } break;
            case 'treasurer': {
                switch(status)
                {
                    case 'collecting': {
                        target = setTargetIfNone(creepMemory, treasureFrom, function(target)
                        {
                            return getEnergy(target) > 0;
                        });
                        if(creep.carry[RESOURCE_ENERGY] == creep.carryCapacity)
                        {
                            setStatus(creepMemory, 'providing');
                        }
                        else if(target)
                        {
                            moveTo(creep, target);
                            withdraw(creep, target, RESOURCE_ENERGY);
                            say(creep, iconPickUp, displayIcon);
                        }
                        else
                        {
                            moveTo(creep, waitingArea);
                            say(creep, iconResting, displayIcon);
                        }
                    } break;
                    case 'providing': {
                        target = setTargetIfNone(creepMemory, treasureTo, function(target)
                        {
                            if(target.structureType == STRUCTURE_TOWER)
                            {
                                return getEnergy(target) < (getEnergyCapacity(target) / 4);
                            }
                            return getEnergy(target) < getEnergyCapacity(target);
                        });
                        if(creep.carry[RESOURCE_ENERGY] == 0)
                        {
                            setStatus(creepMemory, 'collecting');
                        }
                        else if(target)
                        {
                            moveTo(creep, target);
                            transfer(creep, target, RESOURCE_ENERGY);
                            say(creep, iconDropOff, displayIcon);
                        }
                        else
                        {
                            moveTo(creep, waitingArea);
                            say(creep, iconResting, displayIcon);
                        }
                    } break;
                }
            } break;
            case 'warrior': {
                switch(status)
                {
                    case 'fighting': {
                        if(target)
                        {
                            moveTo(creep, target);
                            attack(creep, target);
                            say(creep, iconAttack, displayIcon);
                        }
                        else
                        {
                            setStatus(creepMemory, 'defending');
                        }
                    } break;
                    case 'defending': {
                        target = setTargetIfNone(creepMemory, map(firstWhere(getAllInArea(room, creepMemory.targetArea), function(entity)
                        {
                            var player = tryGet(entity, 'creep.owner.username');
                            return !tryGet(entity, 'my') && player && player.includes('Invader') && tryGet(entity, 'type') == 'creep';
                        }), function(entity)
                        {
                            return tryGet(entity, 'creep');
                        }));
                        if(target)
                        {
                            setStatus(creepMemory, 'fighting', target);
                        }
                        else
                        {
                            moveTo(creep, waitingArea);
                            say(creep, iconDefending, displayIcon);
                        }
                    } break;
                }
            } break;
            case 'healer': {
                switch(status)
                {
                    case 'healing': {
                        target = setTargetIfNone(creepMemory, firstWhere(Game.creeps, function(creep)
                        {
                            return creep.memory.type == 'warrior';
                        }));
                        if(target)
                        {
                            moveTo(creep, target);
                            if(creep.hits < creep.hitsMax)
                            {
                                heal(creep, target);
                                say(creep, iconHealing, displayIcon);
                            }
                            else if(target.hits < target.hitsMax)
                            {
                                heal(creep, target);
                                say(creep, iconHealing, displayIcon);
                            }
                            else
                            {
                                say(creep, iconMoving, displayIcon);
                            }
                        }
                        else
                        {
                            moveTo(creep, waitingArea);
                            say(creep, iconResting, displayIcon);
                        }
                    } break;
                }
            } break;
            case 'miner': {
                switch(status)
                {
                    case 'mining': {
                        target = creepMemory.target || creepMemory.targetRoom;
                        if(target)
                        {
                            moveTo(creep, target);
                            harvest(creep, target);
                            say(creep, iconHarvesting, displayIcon);
                        }
                        else
                        {
                            moveTo(creep, waitingArea);
                            say(creep, iconResting, displayIcon);
                        }
                    } break;
                }
            } break;
            case 'mover': {
                switch(status)
                {
                    case 'pickup': {
                        if(creep.carry[RESOURCE_ENERGY] == creep.carryCapacity)
                        {
                            setStatus(creepMemory, 'dropoff');
                        }
                        else if(target)
                        {
                            moveTo(creep, target);
                            pickup(creep, target);
                            say(creep, iconPickUp, displayIcon);
                        }
                        else
                        {
                            moveTo(creep, waitingArea);
                            say(creep, iconResting, displayIcon);
                        }
                    } break;
                    case 'dropoff': {
                        target = setTargetIfNone(creepMemory, batteryIn, function(target)
                        {
                            return getEnergy(target) < getEnergyCapacity(target);
                        });
                        if(creep.carry[RESOURCE_ENERGY] == 0)
                        {
                            setStatus(creepMemory, 'waiting');
                        }
                        else if(target)
                        {
                            moveTo(creep, target);
                            transfer(creep, target, RESOURCE_ENERGY);
                            say(creep, iconDropOff, displayIcon);
                        }
                        else
                        {
                            moveTo(creep, waitingArea);
                            say(creep, iconResting, displayIcon);
                        }
                    } break;
                }
            } break;
            case 'paver': {
                switch(status)
                {
                    case 'collecting': {
                        target = setTargetIfNone(creepMemory, batteryOut, function(target)
                        {
                            return getEnergy(target) < getEnergyCapacity(target);
                        });
                        if(creep.carry[RESOURCE_ENERGY] == creep.carryCapacity)
                        {
                            setStatus(creepMemory, 'paving');
                        }
                        else if(target)
                        {
                            moveTo(creep, target);
                            withdraw(creep, target, RESOURCE_ENERGY);
                            say(creep, iconPickUp, displayIcon);
                        }
                        else
                        {
                            moveTo(creep, waitingArea);
                            say(creep, iconResting, displayIcon);
                        }
                    } break;
                    case 'paving': {
                        // var rooms = [
                        //     room,
                        //     offset(room, -1, 0),
                        //     offset(room, -1, -1),
                        // ];
                        // target = setTargetIfNone(creepMemory, firstWhere(sortBy(findByTypes(rooms, [FIND_CONSTRUCTION_SITES, FIND_STRUCTURES], [STRUCTURE_ROAD]), 'hits'), function(road)
                        // {
                        //     return road.hits < road.hitsMax * 0.75;
                        // }));
                        // if(creep.carry[RESOURCE_ENERGY] == 0)
                        // {
                        //     setStatus(creepMemory, 'collecting');
                        // }
                        // else if(target)
                        // {
                        //     moveTo(creep, target);
                        //     creep.repair(target);
                        //     say(creep, iconBuilding, displayIcon);
                        // }
                        // else
                        {
                            moveTo(creep, waitingArea);
                            say(creep, iconResting, displayIcon);
                        }
                    } break;
                }
            } break;
            case 'scout': {
                switch(status)
                {
                    case 'scouting': {
                        target = setTargetIfNone(creepMemory, tryGet(Game.flags, creepName));
                        if(target)
                        {
                            moveTo(creep, target);
                            say(creep, iconScouting, displayIcon);
                        }
                        else
                        {
                            moveTo(creep, waitingArea);
                            say(creep, iconResting, displayIcon);
                        }
                    } break;
                }
            } break;
        }
    });

    var batteryInTypes = [
            STRUCTURE_SPAWN,
            STRUCTURE_EXTENSION,
            STRUCTURE_CONTAINER,
            STRUCTURE_STORAGE,
        ],
        batteryOutTypes = [
            STRUCTURE_CONTAINER,
            STRUCTURE_STORAGE,
            STRUCTURE_EXTENSION,
        ],
        treasureFromTypes = [
            STRUCTURE_STORAGE,
            STRUCTURE_CONTAINER,
        ],
        treasureToTypes = [
            STRUCTURE_SPAWN,
            STRUCTURE_EXTENSION,
            STRUCTURE_TOWER,
        ],
        sources      = room.find(FIND_SOURCES),
        structures   = room.find(FIND_CONSTRUCTION_SITES),
        batteriesIn  = sortBy(findByTypes(room, FIND_STRUCTURES, batteryInTypes), function(battery)
        {
            return findFirstKeyWhere(batteryInTypes, battery.structureType) + (1 - (1 / battery.pos.x + (1 - (1 / battery.pos.y))));
        }),
        batteriesOut = sortBy(findByTypes(room, FIND_STRUCTURES, batteryOutTypes), function(battery)
        {
            return findFirstKeyWhere(batteryOutTypes, battery.structureType) + (1 - (1 / battery.pos.x + (1 - (1 / battery.pos.y))));
        }),
        treasuresFrom  = sortBy(findByTypes(room, FIND_STRUCTURES, treasureFromTypes), function(battery)
        {
            return findFirstKeyWhere(treasureFromTypes, battery.structureType) + (1 - (1 / battery.pos.x + (1 - (1 / battery.pos.y))));
        }),
        treasuresTo = sortBy(findByTypes(room, FIND_STRUCTURES, treasureToTypes), function(battery)
        {
            return findFirstKeyWhere(treasureToTypes, battery.structureType) + (1 - (1 / battery.pos.x + (1 - (1 / battery.pos.y))));
        });

    var typeConditions = {
        STRUCTURE_TOWER: function(structure)
        {
            return getEnergy(structure) < getEnergyCapacity(structure) * 0.8;
        }
    }

    if(!Memory.targets)
    {
        Memory.targets = {};
    }

    Memory.targets.source  = _.first(_.filter(sortBy(sources, function(source)
    {
        return targetCount[source.id] && targetCount[source.id] > (Memory.maxCreepsPerSource * 0.5) ? 99999 : 0;
    }), function(source)
    {
        return !targetCount[source.id] || targetCount[source.id] < Memory.maxCreepsPerSource;
    }));
    Memory.targets.structure    = _.first(sortBy(structures, function(structure)
    {
        return -structure.progress;
    }));
    Memory.targets.batteryIn   = firstWhere(batteriesIn, function(battery)
    {
        var energy = getEnergy(battery),
            energyCap = getEnergyCapacity(battery);

        if(typeConditions[battery.structureType])
        {
            return typeConditions[battery.structureType](battery);
        }

        return isset(energy, energyCap) ? energy < energyCap : false;
    });
    Memory.targets.batteryOut  = firstWhere(batteriesOut, function(battery)
    {
        var energy = getEnergy(battery);
        return isset(energy) ? energy > 0 : false;
    });
    Memory.targets.treasureFrom   = firstWhere(treasuresFrom, function(battery)
    {
        var energy = getEnergy(battery);
        return isset(energy) ? energy > 0 : false;
    });
    Memory.targets.treasureTo  = firstWhere(treasuresTo, function(battery)
    {
        var energy = getEnergy(battery),
            energyCap = getEnergyCapacity(battery);

        if(battery.structureType == STRUCTURE_TOWER)
        {
            return isset(energy, energyCap) ? energy < (energyCap / 4) : false;
        }

        return isset(energy, energyCap) ? energy < energyCap : false;
    });
    Memory.targets.control = room.controller;

    each(Memory.targets, function(target, key)
    {
        if(isObject(target) || isArray(target))
        {
            each(target, function(target2, key2)
            {
                if(target2 && target2.id)
                {
                    Memory.targets[key][key2] = target2.id;
                }
            });
        }
        if(target && target.id)
        {
            Memory.targets[key] = target.id;
        }
    });

    var repairsNeededTypes = [
            STRUCTURE_RAMPART,
            STRUCTURE_ROAD,
            STRUCTURE_CONTAINER,
            STRUCTURE_WALL,
        ],
        repairNeeded = firstWhere(sortBy(findByTypes(room, FIND_STRUCTURES, repairsNeededTypes), function(structure)
        {
            return structure.hits;
        }), function(structure)
        {
            return structure.hits < structure.hitsMax;
        });

    var repairTicks     = 3,
        waitTicks       = 3,
        towers          = findByTypes(room, FIND_STRUCTURES, STRUCTURE_TOWER),
        towerIndex      = Memory.tower = (tryGet(Memory, 'tower', -1) + 1) % towers.length,
        tower           = tryGet(towers, towerIndex, false);

    if(Game.time % (repairTicks + waitTicks) > (waitTicks - 1) && tower)
    {
        tower.repair(repairNeeded);
    }
}

module.exports.loop = function ()
{
    lastTimeStep = 0.0;

    for(var i in Memory.creeps)
    {
        if(!Game.creeps[i])
        {
            delete Memory.creeps[i];
        }
    }

    each(Game.spawns, function(spawn)
    {
        processSpawn(spawn);
    });

    each(timeSteps, function(time)
    {
        dump(time.name + ' took ' + time.timeDiff + ' (Total ' + time.timeStep + ') Status ' + time.status);
    });

    screepsplus.collect_stats();

    if(Game.time % 120 == 0)
    {
        Memory.snapshot = tryGet(Memory, 'snapshot', {});
        Memory.snapshot.roomSummary = tryGet(Memory.snapshot, 'roomSummary', []);
        Memory.snapshot.roomSummary.push(Memory.stats.roomSummary);
    }
}