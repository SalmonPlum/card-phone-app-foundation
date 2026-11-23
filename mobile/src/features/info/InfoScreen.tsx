import {useEffect,useRef,useState} from 'react';
import {Linking,ScrollView,StyleSheet,Text,View} from 'react-native';
import {Redirect} from 'expo-router';
import {SafeAreaView} from 'react-native-safe-area-context';
import {configuredInfoPage} from '../../info';
import {isAllowedInfoLink,type InfoBlock,type InfoInline} from '../../info/markdown';
import {useLocale} from '../../i18n/useLocale';
import {t} from '../../i18n/locale';
import {useDockHeight} from '../../navigation/useDockHeight';
import {spacing} from '../../ui/theme';
import {useThemeStyles,type ThemeColors,type ThemeTypography} from '../../ui/useThemeStyles';

export function InfoScreen() {
  const locale=useLocale(),styles=useThemeStyles(makeStyles),dock=useDockHeight();
  const [linkError,setLinkError]=useState(false);
  const mounted=useRef(true),request=useRef(0);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  async function openLink(url:string){
    const token=++request.current;
    setLinkError(false);
    try {if(!isAllowedInfoLink(url))throw new Error('Unsupported link');await Linking.openURL(url);}
    catch {if(mounted.current&&token===request.current)setLinkError(true);}
  }
  if(!configuredInfoPage)return <Redirect href="/"/>;
  const document=configuredInfoPage[locale];
  const plain=(nodes:InfoInline[]):string=>nodes.map(node=>node.type==='text'?node.text:plain(node.children)).join('');
  const inlines=(nodes:InfoInline[]):React.ReactNode=>nodes.map((node,index)=>{
    if(node.type==='text')return node.text;
    if(node.type==='link')return <Text key={index} accessibilityRole="link" accessibilityLabel={plain(node.children)} style={styles.link} onPress={()=>{void openLink(node.url);}}>{inlines(node.children)}</Text>;
    return <Text key={index} style={node.type==='strong'?styles.strong:styles.emphasis}>{inlines(node.children)}</Text>;
  });
  const block=(node:InfoBlock,index:number)=>{
    if(node.type==='rule')return <View key={index} accessible={false} style={styles.rule}/>;
    if(node.type==='list')return <View key={index} style={styles.list}>{node.items.map((item,i)=><View key={i} style={styles.listItem}>
      <Text style={styles.marker}>{node.ordered?`${node.start+i}.`:'•'}</Text><Text style={styles.listCopy}>{inlines(item)}</Text>
    </View>)}</View>;
    if(node.type==='heading')return <Text key={index} accessibilityRole="header" style={[styles.heading,node.level===1?styles.title:node.level===2?styles.section:styles.subheading]}>{inlines(node.children)}</Text>;
    if(node.type==='quote')return <View key={index} style={styles.quote}><Text style={styles.copy}>{inlines(node.children)}</Text></View>;
    return <Text key={index} style={styles.copy}>{inlines(node.children)}</Text>;
  };
  return <SafeAreaView edges={['top','left','right']} style={styles.screen}>
    <ScrollView style={styles.scroll} testID="info-scroll" contentContainerStyle={[styles.content,{paddingBottom:dock+spacing.xl}]}>
      {document.blocks.map(block)}
    </ScrollView>
    {linkError&&<View style={[styles.errorPanel,{marginBottom:dock+spacing.md}]}><Text accessibilityRole="alert" style={styles.error}>{t('infoLinkError',locale)}</Text></View>}
  </SafeAreaView>;
}
const makeStyles=(colors:ThemeColors,typography:ThemeTypography)=>StyleSheet.create({
  screen:{flex:1,backgroundColor:colors.canvas},
  scroll:{flex:1},errorPanel:{padding:spacing.lg,borderTopWidth:1,borderTopColor:colors.border,backgroundColor:colors.surface},
  content:{padding:spacing.xl,gap:spacing.lg,width:'100%',maxWidth:720,alignSelf:'center'},
  heading:{color:colors.primary},title:{...typography.title},section:{...typography.sectionHeading},subheading:{...typography.body,fontWeight:'bold',color:colors.primary},
  copy:{...typography.body,color:colors.text},
  strong:{fontWeight:'bold'},emphasis:{fontStyle:'italic'},link:{color:colors.primary,textDecorationLine:'underline'},
  quote:{borderLeftWidth:3,borderLeftColor:colors.accent,paddingLeft:spacing.lg,paddingVertical:spacing.sm},
  rule:{height:1,backgroundColor:colors.border,marginVertical:spacing.sm},
  list:{gap:spacing.sm},listItem:{flexDirection:'row',gap:spacing.sm},marker:{...typography.body,color:colors.primary},listCopy:{...typography.body,color:colors.text,flex:1},
  error:{...typography.body,color:colors.text},
});
