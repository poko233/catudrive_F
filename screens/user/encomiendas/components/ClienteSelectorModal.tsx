import { Modal } from "@/components/ui/Modal";
import { SearchBar } from "@/components/ui/SearchBar";
import { Button } from "@/components/ui/Button";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";
import { UserRound } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";
import { clienteService } from "../services/cliente.service";
import { Cliente } from "../types/encomienda.types";
import { ClienteFormModal } from "./ClienteFormModal";

export function ClienteSelectorModal({visible,title,value,onClose,onSelect}:{
  visible:boolean; title:string; value:Cliente|null; onClose:()=>void; onSelect:(c:Cliente)=>void;
}){
  const {theme}=useTheme(); const c=theme.colors;
  const [search,setSearch]=useState(""); const [items,setItems]=useState<Cliente[]>([]);
  const [loading,setLoading]=useState(false); const [nuevo,setNuevo]=useState(false);
  const requestSeq=useRef(0);

  const cargar=useCallback(async(q:string)=>{
    const term=q.trim();
    const seq=++requestSeq.current;

    if(term!=="" && term.length<3){
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try{
      const result=await clienteService.buscar(term);
      if(seq===requestSeq.current)setItems(result);
    }catch(e:any){
      if(seq===requestSeq.current){
        Toast.show({type:"error",text1:"No se pudieron cargar clientes",text2:e?.message});
      }
    }finally{
      if(seq===requestSeq.current)setLoading(false);
    }
  },[]);

  useEffect(()=>{
    if(!visible){
      requestSeq.current++;
      return;
    }
    const t=setTimeout(()=>void cargar(search),400);
    return()=>clearTimeout(t);
  },[visible,search,cargar]);

  const emptyMessage=search.trim().length>0&&search.trim().length<3
    ?"Escribe al menos 3 caracteres para buscar."
    :"No se encontraron clientes.";

  return <>
    <Modal visible={visible} title={title} onClose={onClose}>
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={styles.search}><SearchBar value={search} onChangeText={setSearch} placeholder="Buscar por nombre, apellido, CI o teléfono..."/></View>
          <Button title="+ Nuevo cliente" onPress={()=>setNuevo(true)}/>
        </View>
        {loading?<View style={styles.loading}><ActivityIndicator color={c.primary}/></View>:
        <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
          {items.length===0?<ThemedText style={{color:c.textSecondary}}>{emptyMessage}</ThemedText>:
          items.map(item=><Pressable key={item.id} onPress={()=>{onSelect(item);onClose();}}
            style={[styles.item,{borderColor:value?.id===item.id?c.primary:c.border,backgroundColor:c.card}]}>
            <UserRound size={20} color={c.primary}/>
            <View style={styles.info}>
              <ThemedText style={styles.name}>{item.nombre_completo}</ThemedText>
              <ThemedText style={{color:c.textSecondary}}>CI: {item.ci||"—"} · Tel: {item.telefono||"—"}</ThemedText>
            </View>
          </Pressable>)}
        </ScrollView>}
      </View>
    </Modal>
    <ClienteFormModal visible={nuevo} onClose={()=>setNuevo(false)} onCreated={(cl)=>{setNuevo(false);onSelect(cl);onClose();}}/>
  </>;
}
const styles=StyleSheet.create({body:{gap:12},top:{flexDirection:"row",gap:8,alignItems:"flex-end",flexWrap:"wrap"},search:{flex:1,minWidth:250},list:{maxHeight:430},loading:{padding:30,alignItems:"center"},item:{borderWidth:1,borderRadius:12,padding:12,flexDirection:"row",gap:10,alignItems:"center",marginBottom:8},info:{flex:1},name:{fontWeight:"800"}});
