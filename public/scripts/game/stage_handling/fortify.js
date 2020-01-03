import {StageHandler} from './stageHandler.js';
import * as game from '../game.js';
import {map} from "../mapFunctions.js";
import {PlaceArmies} from "./placeArmies.js";

export class Fortify extends StageHandler {

    static onPlayerEvent(event){
	if(event.fortify){
	    if(event.playerID!=game.currPlayer.id){
		console.error('Received message from wrong player');
		return;
	    }

	    let msg = event.fortify;
	    if(msg.from){
		let to = game.mapView.zoneMap[msg.to].node;
		let from = game.mapView.zoneMap[msg.from].node;
		if(to.owner!=from.owner||msg.unitAmount<0||from.troopNumber<=msg.unitAmount){
		    console.error('Malformed fortify');
		} else {
		    from.troopNumber-=msg.unitAmount;
		    to.troopNumber+=msg.unitAmount;
		    console.log('movement done');
		}
		
		
	    }

	    console.log('Fortify stage done');
	    game.nextPlayer();
	    PlaceArmies.select();
	} else {
	    console.error('Unsupported event type received');
	}
    }

    static handleInput(currPlayer, zone, mapView, playerEventSource) {
	if(!currPlayer.isLocal){
	    return;
	}
	
	if(!zone){
	    Fortify._clearReachableZones();
	} else if (Fortify.reachableZones.some(e=>e===zone)){
 	    let from = Fortify.fortifyFrom;
	    let amount = Math.min(from.node.troopNumber-1,
				  Number(window.prompt('Number of units(0-'+(from.node.troopNumber-1)+')')));
	    playerEventSource.sendMessage({fortify:{from:from.node.colorID,
						    to:zone.node.colorID,
						    unitAmount:amount}});
	    
	    Fortify._clearReachableZones();
	} else if (zone == Fortify.fortifyFrom||currPlayer.ownedNodes.every(e=>e.troopNumber<=1)){
	    Fortify._clearReachableZones();
	    playerEventSource.sendMessage({fortify:{}});
	} else if (zone.node.owner===currPlayer&&zone.node.troopNumber>1){
	    Fortify._clearReachableZones();
	    Fortify.fortifyFrom = zone;
	    let fromNodeIndex = map.nodes.findIndex(e=>e===zone.node);
	    let visMap = {};
	    Fortify._getReachableNodes(fromNodeIndex,visMap);



	    Fortify.reachableZones = Object.entries(visMap).filter(([k,v])=>k!=fromNodeIndex)
		.map(([k,v])=>game.mapView.zoneMap[v.colorID]);

	    Fortify.fortifyFrom.activateColor(2);

	    Fortify.reachableZones.forEach((e)=>e.activateColor(1));
	}
	
    }

    static _getReachableNodes(nodeIndex, visitedNodeMap){
	visitedNodeMap[nodeIndex] = map.nodes[nodeIndex];

	for(let i = 0; i < map.connections.length; i++){
	    let from = map.nodes[nodeIndex];
	    let to = map.nodes[i];
	    if(from.owner==to.owner&&map.connections[nodeIndex][i]&&!(i in visitedNodeMap)){
		Fortify._getReachableNodes(i, visitedNodeMap);
	    }
	}
    }
    
    static _clearReachableZones(){
	Fortify.reachableZones.forEach((z)=>{
	    z.deactivateAllColor();
	});
	Fortify.reachableZones = [];
	if(Fortify.fortifyFrom){
	    Fortify.fortifyFrom.deactivateAllColor();
	    Fortify.fortifyFrom = null;
	}
    }

    static select(){
	game.setStageHandler(this);

	Fortify.reachableZones = [];
    }
}