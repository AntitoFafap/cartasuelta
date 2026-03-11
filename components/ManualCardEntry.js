import React from 'react';

import setsList from '../sets.json';

export default function ManualCardEntry({ onCardAdded, sets }) {
  const [formData, setFormData] = React.useState({
    name: '',
    set: '',
    cardNumber: '',
    imageUrl: '',
    price: '',
    stock: '',
    language: 'Español',
    condition: 'Lightly Played',
    cardType: 'Pokémon',
    description: ''
  });
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState(null);

  // Automatiza la URL de imagen para sets conocidos (ej: Ascended Heroes)
  // Automatiza la URL de imagen para cualquier set de TCGdex
  const autoImageUrl = (setId, cardNumber, lang = 'en', quality = 'high', ext = 'webp') => {
    if (!setId || !cardNumber) return '';
    // Normalizar número (puede venir como "045/195" o "45")
    let localId = cardNumber.split('/')[0].trim();
    // Quitar ceros a la izquierda para la URL (pero mantenerlos si existen en TCGdex)
    if (/^0\d+$/.test(localId)) localId = String(Number(localId)).padStart(localId.length, '0');
    // Detectar serie a partir del setId (ej: sv01 -> sv, me02.5 -> me, sm1 -> sm, etc)
    let serie = '';
    const match = setId.match(/^([a-zA-Z]+)/);
    if (match) {
      serie = match[1].toLowerCase();
    } else {
      serie = 'me'; // fallback
    }
    return `https://assets.tcgdex.net/${lang}/${serie}/${setId}/${localId}/${quality}.${ext}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newForm = { ...formData, [name]: value };

    // Si cambia set o número, autogenerar imagen para cualquier set válido
    if ((name === 'cardNumber' || name === 'set') && newForm.cardNumber && newForm.set) {
      // Permitir ingresar nombre o id de set, pero preferir id si es válido
      let setId = newForm.set.trim();
      // Si el usuario ingresa el nombre del set, intentar mapearlo a un id conocido si tienes la lista de sets
      // (opcional: aquí podrías mapear nombres a ids si tienes la lista en props)
      newForm.imageUrl = autoImageUrl(setId, newForm.cardNumber);
    }
    setFormData(newForm);

    // Validar imagen en tiempo real
    if (name === 'imageUrl' && value) {
      const img = new window.Image();
      img.onload = () => setImagePreview(value);
      img.onerror = () => setImagePreview(null);
      img.src = value;
    } else if (name === 'cardNumber' || name === 'set') {
      // Si se autogeneró la imagen
      if (newForm.imageUrl) {
        const img = new window.Image();
        img.onload = () => setImagePreview(newForm.imageUrl);
        img.onerror = () => setImagePreview(null);
        img.src = newForm.imageUrl;
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock)
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error creando carta');
      }

      const newCard = await res.json();
      onCardAdded(newCard);
      
      // Reset formulario
      setFormData({
        name: '',
        set: '',
        cardNumber: '',
        imageUrl: '',
        price: '',
        stock: '',
        language: 'Español',
        condition: 'Lightly Played',
        cardType: 'Pokémon',
        description: ''
      });
      setImagePreview(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      background: '#f8f9fa',
      padding: '30px',
      borderRadius: '10px',
      marginTop: '20px'
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '15px',
      marginBottom: '20px'
    },
    fullWidth: {
      gridColumn: '1 / -1'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column'
    },
    label: {
      marginBottom: '5px',
      fontWeight: 'bold',
      color: '#333',
      fontSize: '14px'
    },
    input: {
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '5px',
      fontFamily: 'inherit',
      fontSize: '14px'
    },
    select: {
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '5px',
      fontFamily: 'inherit',
      fontSize: '14px'
    },
    textarea: {
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '5px',
      fontFamily: 'inherit',
      fontSize: '14px',
      resize: 'vertical',
      minHeight: '80px'
    },
    previewContainer: {
      marginTop: '15px',
      padding: '15px',
      background: 'white',
      borderRadius: '5px',
      borderLeft: '4px solid #007bff'
    },
    preview: {
      maxHeight: '200px',
      maxWidth: '150px',
      borderRadius: '5px',
      marginBottom: '10px'
    },
    previewText: {
      fontSize: '12px',
      color: '#666'
    },
    buttonGroup: {
      display: 'flex',
      gap: '10px',
      marginTop: '20px'
    },
    submitBtn: {
      flex: 1,
      padding: '12px',
      background: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '15px',
      disabled: {
        opacity: '0.5',
        cursor: 'not-allowed'
      }
    },
    error: {
      color: '#d32f2f',
      padding: '10px',
      background: '#ffebee',
      borderRadius: '5px',
      marginBottom: '15px'
    }
  };

  return (
    <div style={styles.container}>
      <h3>📝 Ingreso Manual de Carta</h3>
      {error && <div style={styles.error}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nombre de la Carta *</label>
            <input
              style={styles.input}
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Pikachu"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Colección/Set *</label>
            <input
              style={styles.input}
              type="text"
              name="set"
              value={formData.set}
              onChange={handleChange}
              placeholder="Ej: Base Set"
              list="sets-list"
              required
            />
            <datalist id="sets-list">
              {(Array.isArray(sets) && sets.length > 0 ? sets : setsList).map(set => {
                const setName = typeof set === 'string' ? set : (set?.name || set?.id || String(set));
                const setKey = typeof set === 'string' ? set : (set?.id || set?.name || String(set));
                return <option key={setKey} value={setName} />;
              })}
            </datalist>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Número de Carta</label>
            <input
              style={styles.input}
              type="text"
              name="cardNumber"
              value={formData.cardNumber}
              onChange={handleChange}
              placeholder="Ej: 25/102"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Precio (USD) *</label>
            <input
              style={styles.input}
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Stock (Cantidad) *</label>
            <input
              style={styles.input}
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              placeholder="0"
              min="0"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Idioma</label>
            <select style={styles.select} name="language" value={formData.language} onChange={handleChange}>
              <option>Español</option>
              <option>Inglés</option>
              <option>Francés</option>
              <option>Alemán</option>
              <option>Italiano</option>
              <option>Portugués</option>
              <option>Japonés</option>
              <option>Chino</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Condición</label>
            <select style={styles.select} name="condition" value={formData.condition} onChange={handleChange}>
              <option>Mint</option>
              <option>Near Mint</option>
              <option>Lightly Played</option>
              <option>Moderately Played</option>
              <option>Heavily Played</option>
              <option>Damaged</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Tipo de Carta</label>
            <input
              style={styles.input}
              type="text"
              name="cardType"
              value={formData.cardType}
              onChange={handleChange}
              placeholder="Ej: Pokémon, Supporter, Item"
            />
          </div>

          <div style={{...styles.formGroup, ...styles.fullWidth}}>
            <label style={styles.label}>URL de Imagen *</label>
            <input
              style={styles.input}
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder={
                (formData.set && formData.cardNumber)
                  ? autoImageUrl(formData.set, formData.cardNumber)
                  : 'https://...'
              }
              required
              readOnly={!!(formData.set && formData.cardNumber)}
            />
            {(formData.set && formData.cardNumber) && (
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                URL generada automáticamente para el set <b>{formData.set}</b>. Si la imagen no carga, revisa el número de carta y el ID del set.<br/>
                <span style={{color:'#b91c1c'}}>Formato: https://assets.tcgdex.net/en/&lt;serie&gt;/&lt;setId&gt;/&lt;numero&gt;/high.webp</span>
              </div>
            )}
          </div>

          <div style={{...styles.formGroup, ...styles.fullWidth}}>
            <label style={styles.label}>Descripción</label>
            <textarea
              style={styles.textarea}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detalles adicionales..."
            />
          </div>
        </div>

        {imagePreview && (
          <div style={styles.previewContainer}>
            <div style={styles.previewText}>Vista previa de imagen:</div>
            <img src={imagePreview} alt="preview" style={styles.preview} />
          </div>
        )}

        <div style={styles.buttonGroup}>
          <button 
            type="submit" 
            style={styles.submitBtn}
            disabled={loading || !formData.name || !formData.set || !formData.price || !formData.stock || !formData.imageUrl}
          >
            {loading ? '⏳ Guardando...' : '✅ Agregar Carta'}
          </button>
        </div>
      </form>
    </div>
  );
}
