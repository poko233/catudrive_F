import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";
import { DetalleEncomienda } from "../types/encomienda.types";

type Props={visible:boolean;detalle:DetalleEncomienda|null;onClose:()=>void;onSave:(detalle:DetalleEncomienda)=>void;};
export function EditarDetalleEncomiendaModal({visible,detalle,onClose,onSave}:Props){
 const [nombre,setNombre]=useState(""); const [cantidad,setCantidad]=useState("1"); const [precio,setPrecio]=useState("");
 useEffect(()=>{if(detalle){setNombre(detalle.detalle);setCantidad(String(detalle.cantidad));setPrecio(String(detalle.precio_unitario));}},[detalle,visible]);
 const guardar=()=>{const cant=Number(cantidad),pu=Number(precio);if(!nombre.trim()){Toast.show({type:"error",text1:"Falta el detalle"});return;}if(!Number.isInteger(cant)||cant<1){Toast.show({type:"error",text1:"Cantidad inválida"});return;}if(!Number.isFinite(pu)||pu<0){Toast.show({type:"error",text1:"Precio inválido"});return;}onSave({detalle:nombre.trim(),cantidad:cant,precio_unitario:pu});};
 return <Modal visible={visible} title="Editar detalle" onClose={onClose} maxWidth={520} scrollable={false} footer={<View style={styles.footer}><Button title="Cancelar" variant="secondary" onPress={onClose}/><Button title="Guardar" onPress={guardar}/></View>}>
  <View style={styles.body}><Input label="Detalle *" value={nombre} onChangeText={setNombre} placeholder="Caja, sobre, paquete..."/><View style={styles.row}><View style={styles.flex}><Input label="Cantidad *" value={cantidad} onChangeText={setCantidad} keyboardType="numeric"/></View><View style={styles.flex}><Input label="Precio unitario (Bs) *" value={precio} onChangeText={setPrecio} keyboardType="decimal-pad"/></View></View></View>
 </Modal>;
}
const styles=StyleSheet.create({body:{gap:12},row:{flexDirection:"row",gap:10},flex:{flex:1,minWidth:0},footer:{flexDirection:"row",gap:8,justifyContent:"flex-end",flexWrap:"wrap"}});
