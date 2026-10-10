'use client';

import { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { formatBRL } from '../../services/cart';
import { ArrowLeft, Copy, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, deliveryFee, subtotal, discount, clearCart } = useCart();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    docNumber: '' // CPF
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pixData, setPixData] = useState<{ qrCodeBase64: string, qrCodeCopiaECola: string, vendaId: number } | null>(null);
  const [copied, setCopied] = useState(false);

  // Redireciona se carrinho estiver vazio e não houver PIX gerado
  useEffect(() => {
    if (items.length === 0 && !pixData) {
      router.push('/');
    }
  }, [items, pixData, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generatePix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.docNumber) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/mercadopago/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          total: total,
          items: items.map(item => ({
            ean: item.product.ean,
            title: item.product.nome,
            quantity: item.quantity,
            unit_price: item.product.preco_promocional || item.product.preco_venda
          })),
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          docType: 'CPF',
          docNumber: formData.docNumber.replace(/\D/g, '')
        })
      });

      const data = await response.json();

      if (data.success && data.qrCodeBase64) {
        setPixData({
          qrCodeBase64: data.qrCodeBase64,
          qrCodeCopiaECola: data.qrCodeCopiaECola,
          vendaId: data.vendaId
        });
        clearCart(); // Esvazia o carrinho no local após gerar o PIX
      } else {
        setError(data.message || 'Erro ao gerar pagamento Pix. Tente novamente.');
      }
    } catch (err: any) {
      setError('Erro de conexão ao gerar o PIX.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (pixData?.qrCodeCopiaECola) {
      navigator.clipboard.writeText(pixData.qrCodeCopiaECola);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-20 pb-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition"
        >
          <ArrowLeft className="h-5 w-5" />
          Voltar para a loja
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
          
          {/* Seção Esquerda - Resumo do Pedido ou Formulário */}
          <div className="flex-1 p-6 md:p-8 md:border-r border-slate-800">
            {!pixData ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-6">Finalizar Compra</h2>
                <form onSubmit={generatePix} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Nome</label>
                      <input 
                        type="text" 
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Sobrenome</label>
                      <input 
                        type="text" 
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">E-mail</label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">CPF</label>
                    <input 
                      type="text" 
                      name="docNumber"
                      value={formData.docNumber}
                      onChange={handleInputChange}
                      required
                      placeholder="000.000.000-00"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  
                  {error && (
                    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4" /> {error}
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3.5 px-4 font-bold text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Pagar via PIX Instantâneo'}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Pedido #{pixData.vendaId} Registrado!</h2>
                <p className="text-slate-400 mb-8">Escaneie o QR Code abaixo pelo aplicativo do seu banco para pagar.</p>
                
                {/* Imagem do QR Code em Base64 */}
                <div className="bg-white p-4 rounded-2xl mb-6 shadow-md border border-slate-200">
                  <img 
                    src={`data:image/jpeg;base64,${pixData.qrCodeBase64}`} 
                    alt="QR Code Pix" 
                    className="w-48 h-48 object-contain"
                  />
                </div>

                <div className="w-full">
                  <p className="text-xs text-slate-400 font-semibold mb-2 uppercase tracking-wider text-left">Ou Pix Copia e Cola:</p>
                  <div className="flex bg-slate-950 border border-slate-700 rounded-xl overflow-hidden w-full">
                    <input 
                      type="text" 
                      readOnly 
                      value={pixData.qrCodeCopiaECola}
                      className="flex-1 bg-transparent px-4 py-3 text-xs text-slate-300 outline-none truncate"
                    />
                    <button 
                      onClick={copyToClipboard}
                      className={`px-4 py-3 font-bold text-xs flex items-center gap-2 transition ${copied ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                    >
                      {copied ? <><CheckCircle2 className="h-4 w-4"/> Copiado!</> : <><Copy className="h-4 w-4"/> Copiar</>}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-emerald-400 mt-6 font-medium animate-pulse">
                  Aguardando confirmação do pagamento... (Processamento em tempo real)
                </p>
              </div>
            )}
          </div>

          {/* Seção Direita - Resumo */}
          <div className="w-full md:w-1/3 bg-slate-950/50 p-6 md:p-8">
            <h3 className="text-lg font-bold text-white mb-4">Resumo</h3>
            
            <div className="space-y-4 mb-6">
              {items.length > 0 ? items.map((item) => (
                <div key={item.product.id} className="flex gap-3 items-center">
                  <div className="relative h-12 w-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
                    <img src={item.product.imagem_url} alt={item.product.nome} className="object-cover" />
                    <div className="absolute -top-1.5 -right-1.5 bg-slate-700 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {item.quantity}
                    </div>
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="font-semibold text-white line-clamp-1">{item.product.nome}</p>
                    <p className="text-slate-400">{formatBRL(item.product.preco_venda * item.quantity)}</p>
                  </div>
                </div>
              )) : (
                 <p className="text-xs text-slate-400">Você pagará pelo pedido #{pixData?.vendaId}</p>
              )}
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>{formatBRL(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Taxa de Entrega</span>
                <span>{deliveryFee === 0 ? 'Grátis' : formatBRL(deliveryFee)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Desconto</span>
                  <span>-{formatBRL(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-black text-amber-400 pt-2 border-t border-slate-800">
                <span>Total</span>
                <span>{formatBRL(total)}</span>
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-slate-800">
              <p className="text-[11px] text-slate-500 text-center flex flex-col items-center gap-1.5">
                <span className="flex items-center justify-center bg-slate-900 p-2 rounded-lg w-full">
                  Pagamento Seguro Mercado Pago
                </span>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
