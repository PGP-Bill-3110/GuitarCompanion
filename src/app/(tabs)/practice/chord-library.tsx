import { useMemo, useState } from "react";
import {
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import AppGradientBackground from "../../../components/ui/AppGradientBackground";
import { colors } from "../../../theme/colors";
import {
  allGuitarChords, beginnerChordNames, chordLibrarySource, chordPositionCount,
  formatChordName, getGuitarChord, guitarChordRoots, orderedPositions,
  type GuitarChord, type GuitarChordPosition
} from "../../../data/chordLibrary";
import { canPlayChordAudio, playGuitarChord } from "../../../services/chordAudio";

const ROOTS = ["Tất cả", ...guitarChordRoots];
const QUALITIES: { name: string; suffix: string | null }[] = [
  {name:"Tất cả",suffix:null}, {name:"Trưởng",suffix:"major"}, {name:"Thứ",suffix:"minor"},
  {name:"7",suffix:"7"}, {name:"maj7",suffix:"maj7"}, {name:"m7",suffix:"m7"},
  {name:"sus2",suffix:"sus2"}, {name:"sus4",suffix:"sus4"}, {name:"add9",suffix:"add9"},
  {name:"dim",suffix:"dim"}, {name:"aug",suffix:"aug"}, {name:"m7b5",suffix:"m7b5"},
];
const STRINGS = ["E", "A", "D", "G", "B", "e"];
const LINE_X = (string: number) => 29 + string * 44;
const TOP = 50;
const FRET_H = 42;

function ChordDiagram({position}: {position: GuitarChordPosition}) {
  const base = Math.max(1, position.baseFret || 1);
  const active = position.frets.filter((fret) => fret > 0);
  const fretCount = Math.max(4, ...active, 0);
  const height = TOP + fretCount * FRET_H + 21;
  return (
    <View style={{width:284,height,alignSelf:"center"}}>
      {STRINGS.map((name, i) => (
        <View key={"s"+i} style={{position:"absolute",left:LINE_X(i)-7,top:0,width:14,alignItems:"center"}}>
          <Text style={styles.stringName}>{name}</Text>
        </View>
      ))}
      {Array.from({length:6},(_,i)=>(
        <View key={"string"+i} style={{
          position:"absolute",left:LINE_X(i),top:TOP,width:i===0?2:1.5,
          height:fretCount*FRET_H,backgroundColor:"#AB9BBE"
        }}/>
      ))}
      {Array.from({length:fretCount+1},(_,i)=>(
        <View key={"fret"+i} style={{
          position:"absolute",left:LINE_X(0),top:TOP+i*FRET_H,
          width:LINE_X(5)-LINE_X(0),height:i===0&&base===1?4:1.5,
          backgroundColor:i===0&&base===1?"#F8F5FB":"#AB9BBE"
        }}/>
      ))}
      <Text style={{position:"absolute",left:2,top:TOP+FRET_H*.5-8,color:colors.textSoft,fontSize:12,fontWeight:"700"}}>
        {base}
      </Text>
      {(position.barres || []).filter(fret=>fret>0).map((fret,idx)=>{
        const matching=position.frets.map((f,i)=>f===fret?i:-1).filter(v=>v>=0);
        if(matching.length<2)return null;
        const lo=Math.min(...matching),hi=Math.max(...matching);
        return <View key={"barre"+idx} style={{
          position:"absolute",left:LINE_X(lo)-12,
          top:TOP+(fret-0.5)*FRET_H-11,width:LINE_X(hi)-LINE_X(lo)+24,
          height:22,borderRadius:15,backgroundColor:"#72529E",borderWidth:1,borderColor:"#C8A3ED"
        }}/>;
      })}
      {position.frets.map((fret,string)=>{
        const x=LINE_X(string);
        if(fret<=0)return(
          <Text key={"open"+string} style={{
            position:"absolute",left:x-10,top:27,width:20,textAlign:"center",
            color:fret===0?colors.positive:colors.textMuted,fontWeight:"800",fontSize:15
          }}>{fret===0?"○":"×"}</Text>
        );
        const finger=position.fingers?.[string] || 0;
        return(
          <View key={"dot"+string} style={{
            position:"absolute",left:x-12,top:TOP+(fret-0.5)*FRET_H-12,
            width:24,height:24,borderRadius:12,backgroundColor:colors.accent,
            borderWidth:1,borderColor:"#F3E3FF",alignItems:"center",justifyContent:"center"
          }}>
            <Text style={{color:"#20162D",fontWeight:"900",fontSize:12}}>
              {finger>=1&&finger<=4?finger:"●"}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function ChordCard({name,onPress,selected}: {name:string;onPress:()=>void;selected:boolean}) {
  return <TouchableOpacity accessibilityRole="button" onPress={onPress} style={[styles.chordButton,selected&&styles.chordButtonActive]}>
    <Text style={[styles.chordButtonText,selected&&styles.chordButtonTextActive]}>{name}</Text>
    <Ionicons name="chevron-forward" size={15} color={selected?"#FFFFFF":colors.accent}/>
  </TouchableOpacity>;
}

export default function ChordLibraryScreen() {
  const params = useLocalSearchParams<{chord?: string}>();
  const requested = Array.isArray(params.chord)?params.chord[0]:params.chord;
  const initial = getGuitarChord(requested)?.key
    ? formatChordName(getGuitarChord(requested)!) : "C";

  const [selectedName,setSelectedName]=useState(initial);
  const [positionIndex,setPositionIndex]=useState(0);
  const [search,setSearch]=useState("");
  const [root,setRoot]=useState("Tất cả");
  const [quality,setQuality]=useState<string|null>(null);
  const [allMode,setAllMode]=useState(false);
  const [audioMessage,setAudioMessage]=useState("");

  const chosenChord=getGuitarChord(selectedName) || getGuitarChord("C")!;
  const positions=useMemo(()=>orderedPositions(chosenChord),[chosenChord]);
  const chosenPosition=positions[Math.min(positionIndex,positions.length-1)];
  const names=useMemo(()=>{
    const query=search.trim().toLowerCase().replace(/\s+/g,"");
    const filtered=allGuitarChords.filter(chord=>{
      const name=formatChordName(chord);
      if(root!=="Tất cả"&&chord.key!==root)return false;
      if(quality!==null&&chord.suffix!==quality)return false;
      if(query&&!name.toLowerCase().includes(query))return false;
      if(!allMode&&!query&&root==="Tất cả"&&quality===null&&!beginnerChordNames.includes(name))return false;
      return true;
    });
    const featured=new Set(beginnerChordNames);
    return filtered.sort((a,b)=>{
      const aName=formatChordName(a),bName=formatChordName(b);
      return Number(featured.has(bName))-Number(featured.has(aName))||aName.localeCompare(bName);
    }).map(formatChordName);
  },[search,root,quality,allMode]);

  function choose(name:string) {
    setSelectedName(name);
    setPositionIndex(0);
    setAudioMessage("");
  }
  function play() {
    if(!chosenPosition)return;
    const didPlay=playGuitarChord(chosenPosition);
    setAudioMessage(didPlay?"Đang phát âm mẫu của thế bấm hiện tại.":"Âm mẫu hiện chỉ được hỗ trợ trên web.");
  }

  return(
    <View style={styles.root}>
      <AppGradientBackground/>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.back} onPress={()=>router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.text}/>
          <Text style={styles.backLabel}>Trở về Practice</Text>
        </TouchableOpacity>
        <Text style={styles.kicker}>GUITARCOMPANION · LEARN GUITAR</Text>
        <Text style={styles.title}>Interactive Chord Library</Text>
        <Text style={styles.subtitle}>
          Tra cứu hợp âm guitar, xem thế bấm trên 6 dây và nghe âm mẫu. Từ hợp âm mở cơ bản đến barre, seventh và extended chords.
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={styles.statValue}>{allGuitarChords.length}</Text><Text style={styles.statLabel}>Hợp âm</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{chordPositionCount}</Text><Text style={styles.statLabel}>Thế bấm</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>12</Text><Text style={styles.statLabel}>Nốt gốc</Text></View>
        </View>
        <View style={styles.panels}>
          <View style={styles.libraryPanel}>
            <Text style={styles.sectionTitle}>Tra cứu hợp âm</Text>
            <View style={styles.search}>
              <Ionicons name="search" color={colors.textSoft} size={18}/>
              <TextInput value={search} onChangeText={setSearch}
                placeholder="Ví dụ: C, Am, F#m7, G7, Dsus4..."
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none" style={styles.searchInput}/>
              {search.length>0&&<TouchableOpacity onPress={()=>setSearch("")}>
                <Ionicons name="close-circle" size={19} color={colors.textMuted}/>
              </TouchableOpacity>}
            </View>
            <Text style={styles.filterLabel}>NỐT GỐC</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rootScroller}
              contentContainerStyle={{gap:6,paddingBottom:4}}>
              {ROOTS.map(item=><TouchableOpacity key={item}
                onPress={()=>{setRoot(item);setAllMode(item!=="Tất cả");}}
                style={[styles.chip,root===item&&styles.chipActive]}>
                <Text style={[styles.chipText,root===item&&styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>)}
            </ScrollView>
            <Text style={styles.filterLabel}>LOẠI HỢP ÂM</Text>
            <View style={styles.filters}>
              {QUALITIES.map(item=><TouchableOpacity key={item.name}
                onPress={()=>{setQuality(item.suffix);setAllMode(item.suffix!==null);}}
                style={[styles.chip,quality===item.suffix&&styles.chipActive]}>
                <Text style={[styles.chipText,quality===item.suffix&&styles.chipTextActive]}>{item.name}</Text>
              </TouchableOpacity>)}
            </View>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>{names.length} hợp âm được tìm thấy</Text>
              <TouchableOpacity onPress={()=>setAllMode(value=>!value)}>
                <Text style={styles.showAll}>{allMode?"Xem gợi ý cơ bản":"Khám phá toàn bộ"}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.chordGrid}>
              {names.slice(0,80).map(name=><ChordCard key={name} name={name}
                selected={formatChordName(chosenChord)===name} onPress={()=>choose(name)}/>)}
            </View>
            {names.length>80&&<Text style={styles.helper}>Đang hiển thị 80 hợp âm đầu. Hãy chọn nốt gốc, loại hợp âm hoặc tìm kiếm để thu hẹp.</Text>}
            {names.length===0&&<Text style={styles.helper}>Không tìm thấy hợp âm phù hợp. Hãy thử tên khác.</Text>}
          </View>
          <View style={styles.diagramPanel}>
            <View style={styles.detailHeading}>
              <View style={{flex:1}}>
                <Text style={styles.eyebrow}>THẾ BẤM ĐANG CHỌN</Text>
                <Text style={styles.selectedName}>{formatChordName(chosenChord)}</Text>
                <Text style={styles.subline}>{chosenChord.suffix==="major"?"Hợp âm trưởng":chosenChord.suffix==="minor"?"Hợp âm thứ":chosenChord.suffix+" chord"} · Standard tuning E A D G B E</Text>
              </View>
              <View style={styles.soundIcon}><Ionicons name="musical-notes" size={25} color={colors.accent}/></View>
            </View>
            <View style={styles.diagramCard}>
              <ChordDiagram position={chosenPosition}/>
              <View style={styles.legend}>
                <Text style={styles.legendText}>○ Dây buông</Text>
                <Text style={styles.legendText}>× Không gảy</Text>
                <Text style={styles.legendText}>1–4 Ngón bấm</Text>
              </View>
              <Text style={styles.diagramHelp}>Số bên trái là ngăn đầu của sơ đồ. Thanh màu tím biểu thị ngón chặn (barre).</Text>
            </View>
            <Text style={styles.sectionTitle}>Các thế bấm ({positions.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{gap:8,paddingVertical:10}}>
              {positions.map((position,index)=><TouchableOpacity key={index}
                style={[styles.voicing,positionIndex===index&&styles.voicingActive]}
                onPress={()=>{setPositionIndex(index);setAudioMessage("");}}>
                <Text style={[styles.voicingTitle,positionIndex===index&&styles.voicingSelected]}>
                  Thế {index+1}
                </Text>
                <Text style={styles.voicingSubtitle}>Ngăn {position.baseFret || 1}</Text>
              </TouchableOpacity>)}
            </ScrollView>
            <TouchableOpacity style={[styles.playButton,!canPlayChordAudio()&&styles.playButtonOff]}
              accessibilityRole="button" onPress={play} disabled={!canPlayChordAudio()}>
              <Ionicons name="volume-high" size={21} color="#FFFFFF"/>
              <Text style={styles.playText}>Nghe hợp âm</Text>
            </TouchableOpacity>
            {!!audioMessage&&<Text style={styles.audioHint}>{audioMessage}</Text>}
            <TouchableOpacity style={styles.studyButton} onPress={()=>router.push("/learning-path" as any)}>
              <Ionicons name="school-outline" size={19} color={colors.accent}/>
              <Text style={styles.studyText}>Quay lại lộ trình học cơ bản</Text>
              <Ionicons name="arrow-forward" size={17} color={colors.accent}/>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.credit}>
          Dữ liệu: {chordLibrarySource.name} · © 2016 {chordLibrarySource.author} · Giấy phép MIT. Âm mẫu được tổng hợp đơn giản, chưa phải tiếng đàn guitar thu âm thực tế.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:colors.gradientEnd},
  content:{padding:20,paddingTop:26,paddingBottom:95,width:"100%",maxWidth:1180,alignSelf:"center"},
  back:{flexDirection:"row",alignItems:"center",gap:8,marginBottom:20},
  backLabel:{color:colors.textSoft,fontSize:13,fontWeight:"700"},
  kicker:{color:colors.accent,fontSize:11,fontWeight:"800",letterSpacing:1.7},
  title:{color:colors.text,fontSize:29,fontWeight:"800",marginTop:8},
  subtitle:{color:colors.textSoft,fontSize:13,lineHeight:21,marginTop:10,maxWidth:780},
  statsRow:{flexDirection:"row",gap:12,marginTop:22,marginBottom:17,flexWrap:"wrap"},
  stat:{backgroundColor:colors.surfaceRaised,borderColor:colors.border,borderWidth:1,paddingHorizontal:18,paddingVertical:11,borderRadius:15,minWidth:99},
  statValue:{color:colors.text,fontSize:22,fontWeight:"800"},
  statLabel:{color:colors.textMuted,fontSize:11,marginTop:1},
  panels:{flexDirection:"row",gap:17,flexWrap:"wrap",alignItems:"flex-start"},
  libraryPanel:{flexGrow:1,flexBasis:340,backgroundColor:colors.surface,borderRadius:18,borderColor:colors.border,borderWidth:1,padding:18,minWidth:0},
  diagramPanel:{flexGrow:1,flexBasis:330,backgroundColor:colors.surface,borderRadius:18,borderColor:colors.borderAccent,borderWidth:1,padding:19,minWidth:0},
  sectionTitle:{color:colors.text,fontWeight:"800",fontSize:17,marginBottom:10},
  search:{flexDirection:"row",alignItems:"center",gap:8,borderColor:colors.borderAccent,borderWidth:1,backgroundColor:colors.surfaceMuted,borderRadius:12,paddingHorizontal:12,minHeight:46},
  searchInput:{color:colors.text,fontSize:13,flex:1,paddingVertical:10,minWidth:50},
  filterLabel:{color:colors.textMuted,fontSize:10,fontWeight:"800",letterSpacing:1.1,marginTop:20,marginBottom:9},
  rootScroller:{maxHeight:52},
  filters:{flexDirection:"row",gap:6,flexWrap:"wrap"},
  chip:{borderWidth:1,borderColor:colors.border,borderRadius:10,paddingHorizontal:11,paddingVertical:8,backgroundColor:colors.surfaceMuted},
  chipActive:{backgroundColor:colors.action,borderColor:colors.accent},
  chipText:{color:colors.textSoft,fontSize:12,fontWeight:"700"},
  chipTextActive:{color:"#FFFFFF"},
  resultsHeader:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginTop:20,marginBottom:10,gap:5,flexWrap:"wrap"},
  resultsCount:{color:colors.textSoft,fontSize:12},
  showAll:{color:colors.accent,fontSize:12,fontWeight:"800"},
  chordGrid:{flexDirection:"row",flexWrap:"wrap",gap:8},
  chordButton:{flexBasis:90,flexGrow:1,maxWidth:145,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:7,
    paddingHorizontal:12,paddingVertical:12,borderWidth:1,borderColor:colors.border,borderRadius:11,backgroundColor:colors.surfaceMuted},
  chordButtonActive:{backgroundColor:colors.action,borderColor:colors.accent},
  chordButtonText:{fontSize:14,fontWeight:"800",color:colors.text},
  chordButtonTextActive:{color:"#FFFFFF"},
  helper:{color:colors.textMuted,fontSize:12,lineHeight:19,marginTop:13},
  detailHeading:{flexDirection:"row",justifyContent:"space-between",gap:12,alignItems:"center"},
  eyebrow:{color:colors.accent,fontSize:10,fontWeight:"800",letterSpacing:1.1},
  selectedName:{color:colors.text,fontSize:36,fontWeight:"900",marginTop:3},
  subline:{color:colors.textSoft,fontSize:11,marginTop:5,lineHeight:17},
  soundIcon:{backgroundColor:colors.accentSoft,padding:15,borderRadius:15},
  diagramCard:{borderRadius:14,borderWidth:1,borderColor:colors.borderAccent,backgroundColor:colors.surfaceDeep,paddingTop:14,paddingHorizontal:8,paddingBottom:15,marginTop:18,marginBottom:18},
  stringName:{color:colors.textSoft,fontSize:11,fontWeight:"700"},
  legend:{flexDirection:"row",flexWrap:"wrap",justifyContent:"center",gap:13,marginTop:8},
  legendText:{color:colors.textSoft,fontSize:11},
  diagramHelp:{color:colors.textMuted,textAlign:"center",fontSize:11,lineHeight:18,marginTop:13},
  voicing:{backgroundColor:colors.surfaceMuted,borderColor:colors.border,borderWidth:1,borderRadius:10,minWidth:77,paddingHorizontal:11,paddingVertical:8},
  voicingActive:{backgroundColor:colors.accentSoft,borderColor:colors.accent},
  voicingTitle:{color:colors.textSoft,fontSize:12,fontWeight:"800"},
  voicingSelected:{color:colors.accent},
  voicingSubtitle:{color:colors.textMuted,fontSize:10,marginTop:3},
  playButton:{backgroundColor:colors.action,borderRadius:13,padding:15,flexDirection:"row",justifyContent:"center",alignItems:"center",gap:10,marginTop:14},
  playButtonOff:{opacity:0.45},
  playText:{color:"#FFFFFF",fontWeight:"800",fontSize:14},
  audioHint:{color:colors.textSoft,fontSize:11,marginTop:8},
  studyButton:{flexDirection:"row",alignItems:"center",gap:10,padding:13,marginTop:12,borderWidth:1,borderColor:colors.border,borderRadius:12},
  studyText:{flex:1,color:colors.accent,fontSize:12,fontWeight:"700"},
  credit:{color:colors.textMuted,fontSize:11,lineHeight:18,marginTop:18}
});
