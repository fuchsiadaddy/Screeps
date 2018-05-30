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
    iconDefending   = '🛡';

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

    _.each(arr, function(item, key)
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
    target = tryGet(tryGet(target, 'creep', target), 'id', isset(target) ? target : null);
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
    return Game.getObjectById(creepMemory.target);
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

function inverseOrder(obj)
{
    var count = _.size(obj);

    return _.sortBy(obj, function()
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

function findByTypes(room, find, types)
{
    types = isArray(types) ? types : [types];
    return room.find(find, {
        filter: function(structure)
        {
            return types.includes(structure.structureType);
        }
    })
}

function object(obj)
{
    if(typeof obj != 'string')
    {
        return null;
    }
    return Game.getObjectById(obj);
}

function moveTo(creep, target, within)
{
    within = isset(within) ? within : 1;
    if(isset(creep) && isset(creep.name) && isset(target))
    {
        if(!within || creep.pos.inRangeTo(target, within))
        {
            return;
        }
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
            color   = colors[index % colors.length],
            x       = tryGet(target, 'x'),
            y       = tryGet(target, 'y');

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

        if(isset(x) && isset(y))
        {
            creep.moveTo(x, y, options);
            return;
        }

        if(typeof target == 'string')
        {
            target = Game.getObjectById(target);
        }

        creep.moveTo(target, options);
    }
}

function isset(val)
{
    return val != undefined && val != null;
}

function tryGet(val, attr, def)
{
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

function processSpawn(spawn)
{
    var screepsToMake = {
        // harvester: {
        //     count: 4,
        //     body: fillArray(WORK, 1).concat(fillArray(MOVE, 2)).concat(fillArray(CARRY, 2)),
        //     name: 'harvester-' + randomKey(),
        //     options: {
        //         memory: {
        //             spawn   : spawn.id,
        //             type    : 'harvester',
        //             status  : 'harvesting',
        //             target  : null,
        //         }
        //     }
        // },
        // provider: {
        //     count: 2,
        //     body: fillArray(WORK, 1).concat(fillArray(MOVE, 2)).concat(fillArray(CARRY, 2)),
        //     name: 'provider-' + randomKey(),
        //     options: {
        //         memory: {
        //             spawn   : spawn.id,
        //             type    : 'provider',
        //             status  : 'collecting',
        //             target  : null,
        //         }
        //     }
        // },
        // builder: {
        //     count: 2,
        //     body: fillArray(WORK, 1).concat(fillArray(MOVE, 2)).concat(fillArray(CARRY, 2)),
        //     name: 'builder-' + randomKey(),
        //     options: {
        //         memory: {
        //             spawn   : spawn.id,
        //             type    : 'builder',
        //             status  : 'collecting',
        //             target  : null,
        //         }
        //     }
        // },
        'harvester-v2': {
            count: 6,
            body: fillArray(WORK, 4).concat(fillArray(MOVE, 4)).concat(fillArray(CARRY, 4)),
            name: 'harvester-v2-' + randomKey(),
            options: {
                memory: {
                    spawn   : spawn.id,
                    type    : 'harvester',
                    status  : 'harvesting',
                    target  : null,
                }
            }
        },
        'builder-v2': {
            count: 2,
            body: fillArray(WORK, 4).concat(fillArray(MOVE, 10)).concat(fillArray(CARRY, 6)),
            name: 'builder-v2-' + randomKey(),
            options: {
                memory: {
                    spawn   : spawn.id,
                    type    : 'builder',
                    status  : 'collecting',
                    target  : null,
                }
            }
        },
        'provider-v2': {
            count: 2,
            body: fillArray(WORK, 4).concat(fillArray(MOVE, 4)).concat(fillArray(CARRY, 4)),
            name: 'provider-' + randomKey(),
            options: {
                memory: {
                    spawn   : spawn.id,
                    type    : 'provider',
                    status  : 'collecting',
                    target  : null,
                }
            }
        },
        treasurer: {
            count: 1,
            body: fillArray(MOVE, 5).concat(fillArray(CARRY, 10)),
            name: 'treasurer-' + randomKey(),
            options: {
                memory: {
                    spawn   : spawn.id,
                    type    : 'treasurer',
                    status  : 'collecting',
                    target  : null,
                }
            }
        },
        warrior: {
            count: 1,
            body: fillArray(ATTACK, 10).concat(fillArray(MOVE, 10)),
            name: 'warrior-' + randomKey(),
            options: {
                memory: {
                    spawn   : spawn.id,
                    type    : 'warrior',
                    status  : 'defending',
                    target  : null,
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
                    spawn   : spawn.id,
                    type    : 'healer',
                    status  : 'waiting',
                    target  : null,
                }
            }
        },
        miner: {
            count: 1,
            body: fillArray(MOVE, 3).concat(fillArray(CARRY, 3)).concat(fillArray(WORK, 10)),
            name: 'miner-' + randomKey(),
            options: {
                memory: {
                    spawn   : spawn.id,
                    type    : 'miner',
                    status  : 'waiting',
                    target  : null,
                }
            }
        },
        mover: {
            count: 1,
            body: fillArray(MOVE, 13).concat(fillArray(CARRY, 13)),
            name: 'mover-' + randomKey(),
            options: {
                memory: {
                    spawn   : spawn.id,
                    type    : 'mover',
                    status  : 'waiting',
                    target  : null,
                }
            }
        }
    };

    if(!Memory.creeps[Memory.creepToRepair])
    {
        Memory.creepToRepair = null;
    }

    var typeCount = {};

    targetCount = {};

    _.each(Memory.creeps, function(creepMemory, creepName)
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

    var waitingArea = _.first(room.find(FIND_FLAGS, {
        filter: { name: 'WaitingArea' }
    }));

    _.each(screepsToMake, function(template, key)
    {
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

    _.each(Memory.creeps, function(creepMemory, creepName)
    {
        var displayIcon   = Memory.displayIcon;//Game.time % 4 <= 2;//displayIndex++ % displayChunks == Game.time % displayChunks,
        status  = creepMemory.status,
            target  = Game.getObjectById(creepMemory.target),
            creep   = Game.creeps[creepName];

        if(!creep)
        {
            return;
        }

        if(!creep)
        {
            delete Memory.creeps[creepName];
            return;
        }

        if(!Memory.creepToRepair && creep.ticksToLive < 500)
        {
            Memory.creepToRepair = creepName;
        }

        if(creepName == Memory.creepToRepair)
        {
            if(creep.ticksToLive > 1000)
            {
                Memory.creepToRepair = null;
            }
            else
            {
                moveTo(creep, spawn);
                spawn.renewCreep(creep);
                say(creep, iconRepairing, displayIcon);
                return;
            }
        }

        if(creepMemory.status == 'waiting')
        {
            moveTo(creep, waitingArea);
            say(creep, iconResting, displayIcon);
            return;
        }

        if(creepMemory.status == 'repairing')
        {
            moveTo(creep, spawn);
            spawn.renewCreep(creep);
            say(creep, iconRepairing, displayIcon);
            return;
        }

        if(creepMemory.status == 'goto')
        {
            moveTo(creep, creepMemory.target);
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
                            creep.harvest(target);
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
                            creep.transfer(target, RESOURCE_ENERGY);
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
                            creep.withdraw(target, RESOURCE_ENERGY);
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
                            creep.build(target, RESOURCE_ENERGY);
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
                            creep.withdraw(target, RESOURCE_ENERGY);
                            say(creep, iconPickUp, displayIcon);
                        }
                    } break;
                    case 'providing': {
                        target = control;
                        if(creep.carry[RESOURCE_ENERGY] == 0)
                        {
                            setStatus(creepMemory, 'collecting');
                        }
                        else if(target)
                        {
                            moveTo(creep, target);
                            creep.upgradeController(target);
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
                            creep.withdraw(target, RESOURCE_ENERGY);
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
                            creep.transfer(target, RESOURCE_ENERGY);
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
                        target = Game.getObjectById(creepMemory.target);
                        if(target)
                        {
                            moveTo(creep, target);
                            creep.attack(target);
                            say(creep, iconAttack, displayIcon);
                        }
                        else
                        {
                            moveTo(creep, waitingArea);
                            say(creep, iconResting, displayIcon);
                        }
                    } break;
                    case 'defending': {
                        target = firstWhere(getAllInArea(room, creepMemory.targetArea), function(entity)
                        {
                            return !tryGet(entity, 'my') && tryGet(tryGet(entity, 'owner'), 'username') == 'Invader' && tryGet(entity, 'type') == 'creep';
                        });
                        if(target)
                        {
                            setStatus(creepMemory, 'fighting', target);
                        }
                        else
                        {
                            moveTo(creep, creepMemory.target);
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
                            return creep.memory.type == 'Warrior';
                        }));
                        if(target)
                        {
                            moveTo(creep, target);
                            if(creep.hits < creep.hitsMax)
                            {
                                creep.heal(creep);
                                say(creep, iconHealing, displayIcon);
                            }
                            else if(target.hits < target.hitsMax)
                            {
                                creep.heal(target);
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
                        target = Game.getObjectById(creepMemory.target);
                        target = isset(target) ? target : position(creepMemory.targetRoom);
                        if(target)
                        {
                            moveTo(creep, target);
                            creep.harvest(target);
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
                        target = Game.getObjectById(creepMemory.target);
                        target = isset(target) ? target : position(creepMemory.target);
                        if(creep.carry[RESOURCE_ENERGY] == creep.carryCapacity)
                        {
                            setStatus(creepMemory, 'dropoff');
                        }
                        else if(target)
                        {
                            moveTo(creep, target);
                            creep.pickup(target);
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
                            creep.transfer(target, RESOURCE_ENERGY);
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
        batteriesIn  = _.sortBy(findByTypes(room, FIND_STRUCTURES, batteryInTypes), function(battery)
        {
            return findFirstKeyWhere(batteryInTypes, battery.structureType) + (1 - (1 / battery.pos.x + (1 - (1 / battery.pos.y))));
        }),
        batteriesOut = _.sortBy(findByTypes(room, FIND_STRUCTURES, batteryOutTypes), function(battery)
        {
            return findFirstKeyWhere(batteryOutTypes, battery.structureType) + (1 - (1 / battery.pos.x + (1 - (1 / battery.pos.y))));
        }),
        treasuresFrom  = _.sortBy(findByTypes(room, FIND_STRUCTURES, treasureFromTypes), function(battery)
        {
            return findFirstKeyWhere(treasureFromTypes, battery.structureType) + (1 - (1 / battery.pos.x + (1 - (1 / battery.pos.y))));
        }),
        treasuresTo = _.sortBy(findByTypes(room, FIND_STRUCTURES, treasureToTypes), function(battery)
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

    Memory.targets.source  = _.first(_.filter(_.sortBy(sources, function(source)
    {
        return targetCount[source.id] && targetCount[source.id] > (Memory.maxCreepsPerSource * 0.5) ? 99999 : 0;
    }), function(source)
    {
        return !targetCount[source.id] || targetCount[source.id] < Memory.maxCreepsPerSource;
    }));
    Memory.targets.structure    = _.first(_.sortBy(structures, function(structure)
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

        return isset(energy) && isset(energyCap) ? energy < energyCap : false;
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
            return isset(energy) && isset(energyCap) ? energy < (energyCap / 4) : false;
        }

        return isset(energy) && isset(energyCap) ? energy < energyCap : false;
    });
    Memory.targets.control = room.controller;

    _.each(Memory.targets, function(target, key)
    {
        if(isObject(target) || isArray(target))
        {
            _.each(target, function(target2, key2)
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
        repairNeeded = firstWhere(_.sortBy(findByTypes(room, FIND_STRUCTURES, repairsNeededTypes), function(structure)
        {
            return structure.hits;
        }), function(structure)
        {
            return structure.hits < structure.hitsMax;
        });

    var repairTicks = 4,
        waitTicks = 2;
    if(Game.time % (repairTicks + waitTicks) > (waitTicks - 1))
    {
        _.each(findByTypes(room, FIND_STRUCTURES, STRUCTURE_TOWER), function(tower)
        {
            tower.repair(repairNeeded);
        });
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

    _.each(Game.spawns, function(spawn)
    {
        processSpawn(spawn);
    });

    _.each(timeSteps, function(time)
    {
        dump(time.name + ' took ' + time.timeDiff + ' (Total ' + time.timeStep + ') Status ' + time.status);
    });

    screepsplus.collect_stats();
}